package com.projeto.carrinhoPraiagp02.controller;

import java.time.LocalDate;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import com.projeto.carrinhoPraiagp02.models.*;
import com.projeto.carrinhoPraiagp02.service.ReportService;

@RestController
@RequestMapping("/api/relatorios")
public class ReportController {

    private final ReportService service;

    public ReportController(ReportService service) {
        this.service = service;
    }

    @GetMapping({"", "/dashboard"})
    public Map<String, Object> dashboard() {
        return service.dashboard();
    }

    @GetMapping("/vendas")
    public List<Vendas> sales() {
        return service.sales();
    }

    @GetMapping("/vendas/periodo")
    public List<Vendas> period(@RequestParam LocalDate inicio, @RequestParam LocalDate fim) {
        return service.salesBetween(inicio, fim);
    }

    @GetMapping("/vendas/resumo")
    public Map<String, Object> salesSummary(@RequestParam LocalDate inicio, @RequestParam LocalDate fim) {
        return service.salesSummary(inicio, fim);
    }

    @GetMapping("/estoque")
    public List<Produto> inventory() {
        return service.inventory();
    }

    @GetMapping("/pagamentos")
    public List<Pagamento> payments() {
        return service.payments();
    }

    @GetMapping("/formas-pagamento")
    public Map<String, Long> methods() {
        return service.methods();
    }

    @GetMapping("/pedidos/status")
    public Map<String, Long> orderStatus() {
        return service.orderStatus();
    }

    @GetMapping("/comandas/status")
    public Map<String, Long> comandaStatus() {
        return service.comandaStatus();
    }

    @GetMapping("/produtos-mais-vendidos")
    public List<Map<String, Object>> topProducts() {
        return service.topProducts();
    }
}
