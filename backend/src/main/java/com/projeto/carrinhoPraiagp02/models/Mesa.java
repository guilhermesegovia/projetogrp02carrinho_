package com.projeto.carrinhoPraiagp02.models;

import java.security.SecureRandom;
import java.util.HexFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Mesa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private Integer numero;
    @Column(nullable = false, unique = true, length = 64)
    private String token;

    protected Mesa() {
    }

    public Mesa(Integer numero) {
        this.numero = numero;
        byte[] b = new byte[32];
        new SecureRandom().nextBytes(b);
        token = HexFormat.of().formatHex(b);
    }

    public Long getId() {
        return id;
    }

    public Integer getNumero() {
        return numero;
    }

    public String getToken() {
        return token;
    }
}
