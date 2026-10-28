package com.projeto.carrinhoPraiagp02.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.projeto.carrinhoPraiagp02.models.Pedido;
import com.projeto.carrinhoPraiagp02.service.PedidoService;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService service;

    public PedidoController(PedidoService s) {
        service = s;
    }

    @GetMapping
    public List<Pedido> all() {
        return service.all();
    }

    @GetMapping("/{id}")
    public Pedido get(@PathVariable Long id) {
        return service.get(id);
    }

    record Tracking(Long id, String status, java.time.LocalDateTime data, java.math.BigDecimal valorTotal) {}

    @GetMapping("/{id}/tracking")
    public Tracking tracking(@PathVariable Long id, @RequestHeader("X-Tracking-Token") String token) {
        Pedido p = service.tracking(id, token);
        return new Tracking(p.getId(), p.getStatus(), p.getData(), p.getValorTotal());
    }

    @PatchMapping("/{id}/status")
    public Pedido status(@PathVariable Long id, @RequestParam String status) {
        return service.updateStatus(id, status);
    }
}
