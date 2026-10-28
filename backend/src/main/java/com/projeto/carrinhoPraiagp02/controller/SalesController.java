package com.projeto.carrinhoPraiagp02.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.projeto.carrinhoPraiagp02.models.Vendas;
import com.projeto.carrinhoPraiagp02.service.VendasService;

@RestController
@RequestMapping("/api/vendas")
public class SalesController {

    private final VendasService service;

    public SalesController(VendasService s) {
        service = s;
    }

    @GetMapping
    public List<Vendas> all() {
        return service.all();
    }

    @GetMapping("/{id}")
    public Vendas get(@PathVariable Long id) {
        return service.all().stream().filter(v -> v.getId().equals(id)).findFirst().orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Venda não encontrada."));
    }
}
