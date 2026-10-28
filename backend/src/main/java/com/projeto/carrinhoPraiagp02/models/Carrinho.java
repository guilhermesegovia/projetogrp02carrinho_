package com.projeto.carrinhoPraiagp02.models;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.security.SecureRandom;
import java.util.HexFormat;

@Entity
public class Carrinho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String comandaNumero;
    @JsonIgnore
    @Column(nullable = false, unique = true, length = 64)
    private String accessToken = newToken();
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;
    @OneToMany(mappedBy = "carrinho", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemCarrinho> itens = new ArrayList<>();

    public Carrinho(String numero) {
        comandaNumero = numero;
        accessToken = newToken();
    }

    public Carrinho() {}

    private static String newToken() {
        byte[] token = new byte[32];
        new SecureRandom().nextBytes(token);
        return HexFormat.of().formatHex(token);
    }

    public void add(ItemCarrinho i) {
        itens.add(i);
        i.setCarrinho(this);
        calcular();
    }

    public void remove(ItemCarrinho i) {
        itens.remove(i);
        calcular();
    }

    public void calcular() {
        valorTotal = itens.stream().map(ItemCarrinho::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void clear() {
        itens.clear();
        valorTotal = BigDecimal.ZERO;
    }
    public Long getId() { return id; }
    public String getComandaNumero() { return comandaNumero; }
    public String getAccessToken() { return accessToken; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public List<ItemCarrinho> getItens() { return itens; }
}
