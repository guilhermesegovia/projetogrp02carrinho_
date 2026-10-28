package com.projeto.carrinhoPraiagp02.controller;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.projeto.carrinhoPraiagp02.models.Categoria;
import com.projeto.carrinhoPraiagp02.service.CategoriaService;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    private final CategoriaService service;

    public CategoriaController(CategoriaService service) {
        this.service = service;
    }

    record Input(@NotBlank String nome, String descricao) {}

    @GetMapping
    public List<Categoria> all() {
        return service.listarCategorias();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Categoria create(@Valid @RequestBody Input d) {
        Categoria c = new Categoria();
        c.setNome(d.nome());
        c.setDescricao(d.descricao());
        c.setDocumento(java.util.UUID.randomUUID().toString());
        return service.criarCategoria(c);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Categoria update(@PathVariable Long id, @Valid @RequestBody Input d) {
        Categoria patch = new Categoria();
        patch.setNome(d.nome());
        patch.setDescricao(d.descricao());
        return service.atualizarCategoria(id, patch);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.excluir(id);
    }
}
