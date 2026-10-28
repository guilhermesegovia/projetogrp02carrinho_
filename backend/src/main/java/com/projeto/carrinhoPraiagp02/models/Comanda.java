package com.projeto.carrinhoPraiagp02.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Comanda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String numero;
    @Column(nullable = false)
    private String nomeCliente;
    @Column(nullable = false)
    private String status = "ABERTA";
    @Column(nullable = false)
    private LocalDateTime dataAbertura = LocalDateTime.now();
    private LocalDateTime dataFechamento;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;
    @OneToMany(mappedBy = "comanda")
    @JsonIgnore
    private List<Pedido> pedidos = new ArrayList<>();

    public Comanda(String n, String cliente) {
        numero = n;
        nomeCliente = cliente;
    }

    public void addTotal(BigDecimal v) {
        valorTotal = valorTotal.add(v);
    }

    public void subtractTotal(BigDecimal v) {
        valorTotal = valorTotal.subtract(v);
        if (valorTotal.signum() < 0) {
            valorTotal = BigDecimal.ZERO;
        }
    }

    public void fechar() {
        status = "FECHADA";
        dataFechamento = LocalDateTime.now();
    }
    public Comanda() {}
    public Long getId() { return id; }
    public String getNumero() { return numero; }
    public String getNomeCliente() { return nomeCliente; }
    public String getStatus() { return status; }
    public LocalDateTime getDataAbertura() { return dataAbertura; }
    public LocalDateTime getDataFechamento() { return dataFechamento; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public List<Pedido> getPedidos() { return pedidos; }
}
