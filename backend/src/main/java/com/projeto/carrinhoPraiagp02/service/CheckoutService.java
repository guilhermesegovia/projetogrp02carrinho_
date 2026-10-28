package com.projeto.carrinhoPraiagp02.service;

import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.projeto.carrinhoPraiagp02.models.*;
import com.projeto.carrinhoPraiagp02.repository.*;
import org.springframework.beans.factory.annotation.Value;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class CheckoutService {

    private final CarrinhoRepo carts;
    private final ComandaRepo comandas;
    private final PedidoRepo pedidos;
    private final PagamentoRepo payments;
    private final VendasRepo sales;
    private final ProdutoRepo products;
    private final MovimentacaoRepo movements;
    @Value("${app.payment.simulation.approved:true}")
    private boolean simulatedApproval;

    public CheckoutService(CarrinhoRepo c, ComandaRepo co, PedidoRepo p, PagamentoRepo pa, VendasRepo s, ProdutoRepo pr, MovimentacaoRepo m) {
        carts = c;
        comandas = co;
        pedidos = p;
        payments = pa;
        sales = s;
        products = pr;
        movements = m;
    }

    @Transactional(noRollbackFor = com.projeto.carrinhoPraiagp02.exception.PaymentDeclinedException.class)
    public Pedido checkout(Long cartId, String token, String form, String user) {
        Carrinho cart = carts.findLockedById(cartId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carrinho não encontrado."));
        if (token == null || !MessageDigest.isEqual(cart.getAccessToken().getBytes(StandardCharsets.UTF_8), token.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "O token de acesso ao carrinho é inválido.");
        }
        if (cart.getItens().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O carrinho está vazio.");
        }
        String method = form == null ? "" : form.toUpperCase(Locale.ROOT);
        if (!java.util.Set.of("PIX", "CARTAO", "DINHEIRO").contains(method)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A forma de pagamento é inválida.");
        }
        if (!simulatedApproval) {
            cart.calcular();
            payments.save(new Pagamento(cartId, method, cart.getValorTotal(), "CANCELADO"));
            throw new com.projeto.carrinhoPraiagp02.exception.PaymentDeclinedException();
        }
        Comanda comanda = comandas.findLockedByNumero(cart.getComandaNumero()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comanda não encontrada."));
        if (!comanda.getStatus().equals("ABERTA")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A comanda está fechada.");
        }
        cart.calcular();
        Pedido order = new Pedido(comanda, cart.getValorTotal());
        for (ItemCarrinho ci : cart.getItens()) {
            Produto product = products.findLockedById(ci.getProduto().getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
            if (!Boolean.TRUE.equals(product.getDisponibilidade()) || product.getQuantidadeEstoque() < ci.getQuantidade()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto indisponível ou estoque insuficiente.");
            }
            order.add(new ItemPedido(product, ci.getQuantidade(), ci.getPrecoUnitario()));
        }
        order = pedidos.save(order);
        payments.save(new Pagamento(order, method, order.getValorTotal(), "APROVADO"));
        sales.save(new Vendas(order, comanda, user == null ? "cliente" : user, order.getValorTotal(), method));
        for (ItemCarrinho ci : cart.getItens()) {
            Produto p = products.findLockedById(ci.getProduto().getId()).orElseThrow();
            p.ajustarEstoque(p.getQuantidadeEstoque() - ci.getQuantidade());
            movements.save(new Movimentacao(p, "SAIDA", ci.getQuantidade(), user == null ? "cliente" : user));
        }
        comanda.addTotal(order.getValorTotal());
        cart.clear();
        return order;
    }

    @Transactional
    public Pedido cancel(Long id, String user) {
        Pedido p = pedidos.findLockedById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));
        if (p.getStatus().equals("CANCELADO")) {
            return p;

        }
        if (p.getStatus().equals("ENTREGUE")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não é possível cancelar um pedido já entregue.");

        }
        p.status("CANCELADO");
        payments.findByPedidoId(id).ifPresent(payment -> payment.status("CANCELADO"));
        p.getComanda().subtractTotal(p.getValorTotal());
        for (ItemPedido i : p.getItens()) {
            Produto product = products.findLockedById(i.getProduto().getId()).orElseThrow();
            product.ajustarEstoque(product.getQuantidadeEstoque() + i.getQuantidade());
            movements.save(new Movimentacao(product, "ENTRADA", i.getQuantidade(), user == null ? "system" : user));
        }
        return p;
    }
}
