package com.projeto.carrinhoPraiagp02.controller;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.projeto.carrinhoPraiagp02.models.Usuario;
import com.projeto.carrinhoPraiagp02.service.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService s) {
        service = s;
    }

    record Input(@NotBlank String nome, @NotBlank
            @Email String email, @NotBlank String documento, @NotBlank String senha, @NotBlank String cargo) {}

    @GetMapping
    public List<Usuario> all() {
        return service.all();
    }

    @GetMapping("/{id}")
    public Usuario get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Usuario create(@Valid @RequestBody Input d) {
        return service.create(d.nome(), d.email(), d.documento(), d.senha(), d.cargo());
    }

    @PutMapping("/{id}")
    public Usuario update(@PathVariable Long id, @Valid @RequestBody Input d) {
        return service.update(id, d.nome(), d.email(), d.documento(), d.senha(), d.cargo());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
