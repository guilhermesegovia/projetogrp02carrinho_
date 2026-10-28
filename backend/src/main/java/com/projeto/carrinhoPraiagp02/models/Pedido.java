package com.projeto.carrinhoPraiagp02.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.security.SecureRandom;
import java.util.HexFormat;

@Entity
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private Comanda comanda;
    @Column(nullable = false)
    private LocalDateTime data = LocalDateTime.now();
    @Column(nullable = false)
    private String status = "PENDENTE";
    @JsonIgnore
    @Column(nullable = false, unique = true, length = 64)
    private String trackingToken = createToken();
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemPedido> itens = new ArrayList<>();

    public Pedido(Comanda c, BigDecimal total) {
        comanda = c;
        valorTotal = total == null ? BigDecimal.ZERO : total;
    }

    private static String createToken() {
        byte[] b = new byte[32];
        new SecureRandom().nextBytes(b);
        return HexFormat.of().formatHex(b);
    }

    public void add(ItemPedido i) {
        itens.add(i);
        i.setPedido(this);
    }

    public void status(String s) {
        status = s;
    }
    public Pedido() {}
    public Long getId() { return id; }
    public Comanda getComanda() { return comanda; }
    public LocalDateTime getData() { return data; }
    public String getStatus() { return status; }
    public String getTrackingToken() { return trackingToken; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public List<ItemPedido> getItens() { return itens; }
}
