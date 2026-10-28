package com.projeto.carrinhoPraiagp02.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.projeto.carrinhoPraiagp02.models.Pedido;
import com.projeto.carrinhoPraiagp02.service.CheckoutService;

@RestController
@RequestMapping("/api")
public class CheckoutController {

    private final CheckoutService checkout;

    public CheckoutController(CheckoutService c) {
        checkout = c;
    }

    record Pay(@NotBlank String formaPagamento) {}

    record CheckoutResult(Long pedidoId, String status, java.math.BigDecimal valorTotal, String trackingToken) {}

    @PostMapping("/carrinhos/{id}/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResult checkout(@PathVariable Long id, @RequestHeader(value = "X-Cart-Token", required = false) String token, @Valid @RequestBody Pay p, Authentication auth) {
        Pedido order = checkout.checkout(id, token, p.formaPagamento(), auth == null ? "cliente" : auth.getName());
        return new CheckoutResult(order.getId(), order.getStatus(), order.getValorTotal(), order.getTrackingToken());
    }

    @PostMapping("/pedidos/{id}/cancelar")
    public CheckoutResult cancel(@PathVariable Long id, Authentication auth) {
        Pedido order = checkout.cancel(id, auth == null ? "system" : auth.getName());
        return new CheckoutResult(order.getId(), order.getStatus(), order.getValorTotal(), null);
    }
}
