package com.projeto.carrinhoPraiagp02.models;

import jakarta.persistence.*;
import java.security.SecureRandom;
import java.util.HexFormat;

@Entity
public class Mesa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true) private Integer numero;
    @Column(nullable=false, unique=true, length=64) private String token;
    protected Mesa() {}
    public Mesa(Integer numero) { this.numero=numero; byte[] b=new byte[32]; new SecureRandom().nextBytes(b); token=HexFormat.of().formatHex(b); }
    public Long getId(){return id;} public Integer getNumero(){return numero;} public String getToken(){return token;}
}
