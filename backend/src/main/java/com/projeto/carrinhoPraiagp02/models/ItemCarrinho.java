package com.projeto.carrinhoPraiagp02.models;

import java.math.BigDecimal;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class ItemCarrinho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JsonIgnore
    private Carrinho carrinho;
    @ManyToOne(optional = false)
    private Produto produto;
    @Column(nullable = false)
    private int quantidade;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precoUnitario;

    public ItemCarrinho(Produto p, int q) {
        produto = p;
        quantidade = q;
        precoUnitario = p.getPreco();
    }

    public void setCarrinho(Carrinho c) {
        carrinho = c;
    }

    public void quantidade(int q) {
        quantidade = q;
    }

    public BigDecimal subtotal() {
        return precoUnitario.multiply(BigDecimal.valueOf(quantidade));
    }
    public ItemCarrinho() {}
    public Long getId() { return id; }
    public Carrinho getCarrinho() { return carrinho; }
    public Produto getProduto() { return produto; }
    public int getQuantidade() { return quantidade; }
    public BigDecimal getPrecoUnitario() { return precoUnitario; }
}
