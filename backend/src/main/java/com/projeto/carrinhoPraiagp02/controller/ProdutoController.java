package com.projeto.carrinhoPraiagp02.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.projeto.carrinhoPraiagp02.models.Produto;
import com.projeto.carrinhoPraiagp02.service.ProdutoService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    private final ProdutoService service;

    public ProdutoController(ProdutoService service) {
        this.service = service;
    }

    record Input(@NotBlank String nome, String descricao, @Size(max = 2048) String fotoUrl, @NotNull
            @DecimalMin("0.00") java.math.BigDecimal preco, @NotNull
            @PositiveOrZero Integer quantidadeEstoque, @NotNull
            @PositiveOrZero Integer estoqueMinimo, @NotBlank String categoria, @NotNull Boolean disponibilidade) {}

    @GetMapping
    public List<Produto> all() {
        return service.all();
    }

    @GetMapping("/{id}")
    public Produto get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Produto create(@Valid @RequestBody Input d) {
        Produto p = new Produto();
        p.setNome(d.nome());
        p.setDescricao(d.descricao() == null ? "" : d.descricao());
        p.setFotoUrl(d.fotoUrl());
        p.setPreco(d.preco());
        p.setQuantidadeEstoque(d.quantidadeEstoque());
        p.setEstoqueMinimo(d.estoqueMinimo());
        p.setCategoria(d.categoria());
        p.setDisponibilidade(d.disponibilidade());
        return service.save(p);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Produto update(@PathVariable Long id, @Valid @RequestBody Input d) {
        return service.update(id, d.nome(), d.descricao() == null ? "" : d.descricao(), d.fotoUrl(), d.preco(), d.quantidadeEstoque(), d.estoqueMinimo(), d.categoria(), d.disponibilidade());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
