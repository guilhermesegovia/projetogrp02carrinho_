package com.projeto.carrinhoPraiagp02.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Vendas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(optional = false)
    @JsonIgnore
    private Pedido pedido;
    @ManyToOne(optional = false)
    private Comanda comanda;
    @Column(nullable = false)
    private String usuario;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal;
    @Column(nullable = false)
    private String formaPagamento;
    @Column(nullable = false)
    private LocalDateTime data = LocalDateTime.now();

    public Vendas(Pedido p, Comanda c, String user, BigDecimal total, String form) {
        pedido = p;
        comanda = c;
        usuario = user;
        valorTotal = total;
        formaPagamento = form;
    }
    public Vendas() {}
    public Long getId() { return id; }
    public Pedido getPedido() { return pedido; }
    public Comanda getComanda() { return comanda; }
    public String getUsuario() { return usuario; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public String getFormaPagamento() { return formaPagamento; }
    public LocalDateTime getData() { return data; }
}
