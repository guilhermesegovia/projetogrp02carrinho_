package com.projeto.carrinhoPraiagp02.models;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class TestPurchaseItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) private TestPurchase purchase;
    @Column(nullable=false) private Long produtoId;
    @Column(nullable=false, length=200) private String nomeProduto;
    @Column(nullable=false) private Integer quantidade;
    @Column(nullable=false, precision=10, scale=2) private BigDecimal precoUnitario;
    protected TestPurchaseItem() {}
    public TestPurchaseItem(Long produtoId,String nomeProduto,int quantidade,BigDecimal preco){this.produtoId=produtoId;this.nomeProduto=nomeProduto;this.quantidade=quantidade;this.precoUnitario=preco;}
    public void setPurchase(TestPurchase p){purchase=p;} public Long getProdutoId(){return produtoId;} public String getNomeProduto(){return nomeProduto;} public Integer getQuantidade(){return quantidade;} public BigDecimal getPrecoUnitario(){return precoUnitario;}
}
