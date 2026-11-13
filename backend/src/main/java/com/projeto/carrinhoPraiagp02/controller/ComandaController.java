package com.projeto.carrinhoPraiagp02.controller;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.projeto.carrinhoPraiagp02.models.Comanda;
import com.projeto.carrinhoPraiagp02.models.Pedido;
import com.projeto.carrinhoPraiagp02.service.ComandaService;

@RestController
@RequestMapping("/api/comandas")
public class ComandaController {

    private final ComandaService service;

    public ComandaController(ComandaService service) {
        this.service = service;
    }

    record Input(@NotBlank String numero, @NotBlank String nomeCliente) {}

    record CustomerOpen(@NotBlank String nomeCliente, String mesaToken) {}

    record PublicComanda(String numero, String nomeCliente, String status, java.math.BigDecimal valorTotal) {}

    @PostMapping("/cliente")
    @ResponseStatus(HttpStatus.CREATED)
    public PublicComanda openCustomer(@Valid @RequestBody CustomerOpen input) {
        Comanda c = service.openForCustomer(input.nomeCliente(), input.mesaToken());
        return new PublicComanda(c.getNumero(), c.getNomeCliente(), c.getStatus(), c.getValorTotal());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    public List<Comanda> all() {
        return service.all();
    }

    @GetMapping("/{numero}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    public Comanda get(@PathVariable String numero) {
        return service.get(numero);
    }

    @GetMapping("/{numero}/pedidos")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    public List<Pedido> orders(@PathVariable String numero) {
        return service.orders(numero);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    public Comanda open(@Valid @RequestBody Input input) {
        return service.open(input.numero(), input.nomeCliente());
    }

    @PostMapping("/{numero}/fechar")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    public Comanda close(@PathVariable String numero) {
        return service.close(numero);
    }
}
