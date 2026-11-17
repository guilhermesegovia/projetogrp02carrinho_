package com.projeto.carrinhoPraiagp02.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class TestPurchase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, length=100) private String nomeCliente;
    private Integer mesaNumero;
    @Column(nullable=false) private LocalDateTime data = LocalDateTime.now();
    @Column(nullable=false) private String status = "PENDENTE";
    @Column(nullable=false, precision=12, scale=2) private BigDecimal valorTotal = BigDecimal.ZERO;
    @OneToMany(mappedBy="purchase", cascade=CascadeType.ALL, orphanRemoval=true) private List<TestPurchaseItem> itens = new ArrayList<>();
    protected TestPurchase() {}
    public TestPurchase(String nomeCliente, Integer mesaNumero) { this.nomeCliente=nomeCliente; this.mesaNumero=mesaNumero; }
    public void add(TestPurchaseItem item) { itens.add(item); item.setPurchase(this); valorTotal=valorTotal.add(item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade()))); }
    public void setStatus(String status){this.status=status;}
    public Long getId(){return id;} public String getNomeCliente(){return nomeCliente;} public Integer getMesaNumero(){return mesaNumero;} public LocalDateTime getData(){return data;} public String getStatus(){return status;} public BigDecimal getValorTotal(){return valorTotal;} public List<TestPurchaseItem> getItens(){return itens;}
}
