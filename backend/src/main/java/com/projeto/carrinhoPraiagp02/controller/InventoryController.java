package com.projeto.carrinhoPraiagp02.controller;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.projeto.carrinhoPraiagp02.models.Movimentacao;
import com.projeto.carrinhoPraiagp02.models.Produto;
import com.projeto.carrinhoPraiagp02.service.MovimentacaoService;

@RestController
@RequestMapping("/api/estoque")
public class InventoryController {

    private final MovimentacaoService service;

    public InventoryController(MovimentacaoService service) {
        this.service = service;
    }

    record Change(@PositiveOrZero int quantidade, @NotBlank String tipo) {}

    @GetMapping("/movimentacoes")
    public List<Movimentacao> all() {
        return service.all();
    }

    @PostMapping("/{productId}/movimentacoes")
    public Movimentacao change(@PathVariable Long productId, @Valid @RequestBody Change change, Authentication auth) {
        return service.change(productId, change.tipo(), change.quantidade(), auth == null ? "system" : auth.getName());
    }

    @GetMapping("/baixo")
    public List<Produto> low() {
        return service.lowStock();
    }
}
