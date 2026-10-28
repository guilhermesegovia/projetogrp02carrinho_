package com.projeto.carrinhoPraiagp02.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne
    @JsonIgnore
    private Pedido pedido;
    private Long carrinhoId;
    @Column(nullable = false)
    private String formaPagamento;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;
    @Column(nullable = false)
    private String status;
    @Column(nullable = false)
    private LocalDateTime data = LocalDateTime.now();

    public Pagamento(Pedido p, String f, BigDecimal v, String s) {
        pedido = p;
        formaPagamento = f;
        valor = v;
        status = s;
    }

    public Pagamento(Long cartId, String form, BigDecimal amount, String status) {
        carrinhoId = cartId;
        formaPagamento = form;
        valor = amount;
        this.status = status;
    }

    public void status(String status) {
        this.status = status;
    }
    public Pagamento() {}
    public Long getId() { return id; }
    public Pedido getPedido() { return pedido; }
    public Long getCarrinhoId() { return carrinhoId; }
    public String getFormaPagamento() { return formaPagamento; }
    public BigDecimal getValor() { return valor; }
    public String getStatus() { return status; }
    public LocalDateTime getData() { return data; }
}
