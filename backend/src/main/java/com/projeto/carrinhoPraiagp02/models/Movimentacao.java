package com.projeto.carrinhoPraiagp02.models;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
public class Movimentacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private Produto produto;
    @Column(nullable = false)
    private String tipo;
    @Column(nullable = false)
    private int quantidade;
    @Column(nullable = false)
    private LocalDateTime data = LocalDateTime.now();
    @Column(nullable = false)
    private String usuario;

    public Movimentacao(Produto p, String tipo, int q, String user) {
        produto = p;
        this.tipo = tipo;
        quantidade = q;
        usuario = user;
    }
    public Movimentacao() {}
    public Long getId() { return id; }
    public Produto getProduto() { return produto; }
    public String getTipo() { return tipo; }
    public int getQuantidade() { return quantidade; }
    public LocalDateTime getData() { return data; }
    public String getUsuario() { return usuario; }
}
