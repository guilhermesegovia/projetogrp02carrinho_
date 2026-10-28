package com.projeto.carrinhoPraiagp02.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import com.projeto.carrinhoPraiagp02.models.*;
import com.projeto.carrinhoPraiagp02.repository.*;

@Service
@Transactional
public class CarrinhoService {

    private final CarrinhoRepo carts;
    private final ProdutoRepo products;
    private final ComandaRepo comandas;

    public CarrinhoService(CarrinhoRepo c, ProdutoRepo p, ComandaRepo comandas) {
        carts = c;
        products = p;
        this.comandas = comandas;
    }

    public Carrinho criar(String numero) {
        if (comandas.findByNumero(numero).filter(c -> c.getStatus().equals("ABERTA")).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "É necessário informar uma comanda aberta.");
        }
        if (carts.findByComandaNumero(numero).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um carrinho para esta comanda.");
        }
        return carts.save(new Carrinho(numero));
    }

    public Carrinho authorize(Long id, String token) {
        Carrinho cart = carts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carrinho não encontrado."));
        if (token == null || !constantTimeEquals(cart.getAccessToken(), token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "O token de acesso ao carrinho é inválido.");
        }return cart;
    }

    private boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }

    public Carrinho adicionar(Long cartId, String token, Long productId, int quantity) {
        if (quantity < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A quantidade deve ser maior que zero.");

        }
        Carrinho c = authorize(cartId, token);
        Produto p = products.findLockedById(productId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        if (p.getQuantidadeEstoque() < quantity) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto indisponível ou estoque insuficiente.");

        }
        ItemCarrinho existing = c.getItens().stream().filter(i -> i.getProduto().getId().equals(productId)).findFirst().orElse(null);
        if (existing != null) {
            if (p.getQuantidadeEstoque() < existing.getQuantidade() + quantity) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Estoque insuficiente.");

            }
            existing.quantidade(existing.getQuantidade() + quantity);
        } else {
            c.add(new ItemCarrinho(p, quantity));

        }
        c.calcular();
        return c;
    }

    public Carrinho quantidade(Long cartId, String token, Long productId, int q) {
        Carrinho c = authorize(cartId, token);
        ItemCarrinho i = c.getItens().stream().filter(x -> x.getProduto().getId().equals(productId)).findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item do carrinho não encontrado."));
        if (q < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A quantidade deve ser maior que zero.");

        }
        if (i.getProduto().getQuantidadeEstoque() < q) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Estoque insuficiente.");

        }
        i.quantidade(q);
        c.calcular();
        return c;
    }

    public Carrinho remover(Long id, String token, Long product) {
        Carrinho c = authorize(id, token);
        c.getItens().stream().filter(i -> i.getProduto().getId().equals(product)).findFirst().ifPresent(c::remove);
        return c;
    }

    public Carrinho limpar(Long id, String token) {
        Carrinho c = authorize(id, token);
        c.clear();
        return c;
    }

    @Transactional(readOnly = true)
    public List<Carrinho> listar() {
        return carts.findAll();
    }

    public Carrinho get(Long id, String token) {
        return authorize(id, token);
    }
}
