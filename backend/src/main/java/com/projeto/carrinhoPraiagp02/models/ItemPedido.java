package com.projeto.carrinhoPraiagp02.models;

import java.math.BigDecimal;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JsonIgnore
    private Pedido pedido;
    @ManyToOne(optional = false)
    private Produto produto;
    @Column(nullable = false)
    private int quantidade;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precoUnitario;

    public ItemPedido(Produto p, int q, BigDecimal price) {
        produto = p;
        quantidade = q;
        precoUnitario = price;
    }

    public void setPedido(Pedido p) {
        pedido = p;
    }
    public ItemPedido() {}
    public Long getId() { return id; }
    public Pedido getPedido() { return pedido; }
    public Produto getProduto() { return produto; }
    public int getQuantidade() { return quantidade; }
    public BigDecimal getPrecoUnitario() { return precoUnitario; }
}
