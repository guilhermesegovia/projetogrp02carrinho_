package com.projeto.carrinhoPraiagp02.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.projeto.carrinhoPraiagp02.models.*;
import com.projeto.carrinhoPraiagp02.repository.*;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final PedidoRepo orders;
    private final VendasRepo sales;
    private final ComandaRepo comandas;
    private final ProdutoRepo products;
    private final PagamentoRepo payments;

    public ReportService(PedidoRepo o, VendasRepo s, ComandaRepo c, ProdutoRepo p, PagamentoRepo pa) {
        orders = o;
        sales = s;
        comandas = c;
        products = p;
        payments = pa;
    }

    public Map<String, Object> dashboard() {
        LocalDate today = LocalDate.now();
        List<Vendas> daily = sales.findAll().stream().filter(s -> !s.getPedido().getStatus().equals("CANCELADO") && s.getData().toLocalDate().equals(today)).toList();
        BigDecimal revenue = daily.stream().map(Vendas::getValorTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Long> states = new TreeMap<>();
        orders.findAll().forEach(o -> states.merge(o.getStatus(), 1L, Long::sum));
        return Map.of("vendasHoje", daily.size(), "faturamentoHoje", revenue, "pedidosPorStatus", states, "comandasAbertas", comandas.findAll().stream().filter(c -> c.getStatus().equals("ABERTA")).count(), "comandasFechadas", comandas.findAll().stream().filter(c -> c.getStatus().equals("FECHADA")).count(), "pedidosEmAndamento", orders.findAll().stream().filter(o -> List.of("PENDENTE", "EM_PREPARO", "PRONTO").contains(o.getStatus())).count(), "estoque", products.findAll(), "estoqueBaixo", products.findAll().stream().filter(p -> p.getQuantidadeEstoque() < p.getEstoqueMinimo()).toList());
    }

    public List<Vendas> salesBetween(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O período informado é inválido.");

        }
        return sales.findAll().stream().filter(s -> !s.getPedido().getStatus().equals("CANCELADO") && !s.getData().toLocalDate().isBefore(start) && !s.getData().toLocalDate().isAfter(end)).toList();
    }

    public Map<String, Object> salesSummary(LocalDate start, LocalDate end) {
        List<Vendas> matching = salesBetween(start, end);
        BigDecimal revenue = matching.stream().map(Vendas::getValorTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("inicio", start, "fim", end, "quantidadeVendas", matching.size(), "faturamento", revenue, "vendas", matching);
    }

    public List<Vendas> sales() {
        return sales.findAll().stream().filter(s -> !s.getPedido().getStatus().equals("CANCELADO")).toList();
    }

    public List<Pagamento> payments() {
        return payments.findAll();
    }

    public List<Produto> inventory() {
        return products.findAll();
    }

    public Map<String, Long> methods() {
        Map<String, Long> m = new TreeMap<>();
        payments.findAll().stream().filter(p -> p.getStatus().equals("APROVADO") && p.getPedido() != null && !p.getPedido().getStatus().equals("CANCELADO")).forEach(p -> m.merge(p.getFormaPagamento(), 1L, Long::sum));
        return m;
    }

    public Map<String, Long> orderStatus() {
        Map<String, Long> m = new TreeMap<>();
        orders.findAll().forEach(o -> m.merge(o.getStatus(), 1L, Long::sum));
        return m;
    }

    public Map<String, Long> comandaStatus() {
        Map<String, Long> m = new TreeMap<>();
        comandas.findAll().forEach(c -> m.merge(c.getStatus(), 1L, Long::sum));
        return m;
    }

    public List<Map<String, Object>> topProducts() {
        Map<Long, Long> qty = new HashMap<>();
        orders.findAll().stream().filter(o -> !o.getStatus().equals("CANCELADO")).flatMap(o -> o.getItens().stream()).forEach(i -> qty.merge(i.getProduto().getId(), (long) i.getQuantidade(), Long::sum));
        return products.findAll().stream().filter(p -> qty.containsKey(p.getId())).sorted(Comparator.comparingLong((Produto p) -> qty.get(p.getId())).reversed()).limit(10).map(p -> Map.<String, Object>of("produtoId", p.getId(), "nome", p.getNome(), "quantidadeVendida", qty.get(p.getId()))).toList();
    }
}
