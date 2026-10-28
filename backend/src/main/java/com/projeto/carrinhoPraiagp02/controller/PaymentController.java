package com.projeto.carrinhoPraiagp02.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.projeto.carrinhoPraiagp02.models.Pagamento;
import com.projeto.carrinhoPraiagp02.service.PagamentoService;

@RestController
@RequestMapping("/api/pagamentos")
public class PaymentController {

    private final PagamentoService service;

    public PaymentController(PagamentoService s) {
        service = s;
    }

    @GetMapping
    public List<Pagamento> all() {
        return service.all();
    }

    @GetMapping("/{id}")
    public Pagamento get(@PathVariable Long id) {
        return service.get(id);
    }
}
