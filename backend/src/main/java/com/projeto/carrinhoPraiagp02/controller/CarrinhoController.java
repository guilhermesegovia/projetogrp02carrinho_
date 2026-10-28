package com.projeto.carrinhoPraiagp02.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.projeto.carrinhoPraiagp02.models.Carrinho;
import com.projeto.carrinhoPraiagp02.service.CarrinhoService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/carrinhos")
public class CarrinhoController {

    private final CarrinhoService service;

    public CarrinhoController(CarrinhoService s) {
        service = s;
    }

    record Create(@NotBlank String comandaNumero) {}

    record Add(@Positive Long produtoId, @Positive int quantidade) {}

    record ItemView(Long produtoId, String nome, int quantidade, BigDecimal precoUnitario, BigDecimal subtotal) {}

    record CartView(Long id, String comandaNumero, BigDecimal valorTotal, List<ItemView> itens) {}

    record Created(Long id, String accessToken, BigDecimal valorTotal, List<ItemView> itens) {}

    private CartView view(Carrinho c) {
        return new CartView(c.getId(), c.getComandaNumero(), c.getValorTotal(), c.getItens().stream().map(i -> new ItemView(i.getProduto().getId(), i.getProduto().getNome(), i.getQuantidade(), i.getPrecoUnitario(), i.subtotal())).toList());
    }

    private Created created(Carrinho c) {
        CartView v = view(c);
        return new Created(c.getId(), c.getAccessToken(), v.valorTotal(), v.itens());
    }

    @GetMapping
    public List<CartView> all() {
        return service.listar().stream().map(this::view).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Created create(@Valid @RequestBody Create d) {
        return created(service.criar(d.comandaNumero()));
    }

    @PostMapping("/{id}/itens")
    public CartView add(@PathVariable Long id, @RequestHeader(value = "X-Cart-Token", required = false) String token, @Valid @RequestBody Add d) {
        return view(service.adicionar(id, token, d.produtoId(), d.quantidade()));
    }

    @PutMapping("/{id}/itens/{produtoId}")
    public CartView update(@PathVariable Long id, @RequestHeader(value = "X-Cart-Token", required = false) String token, @PathVariable Long produtoId, @RequestParam @Positive int quantidade) {
        return view(service.quantidade(id, token, produtoId, quantidade));
    }

    @DeleteMapping("/{id}/itens/{produtoId}")
    public CartView remove(@PathVariable Long id, @RequestHeader(value = "X-Cart-Token", required = false) String token, @PathVariable Long produtoId) {
        return view(service.remover(id, token, produtoId));
    }

    @DeleteMapping("/{id}/itens")
    public CartView clear(@PathVariable Long id, @RequestHeader(value = "X-Cart-Token", required = false) String token) {
        return view(service.limpar(id, token));
    }

    @GetMapping("/{id}")
    public CartView get(@PathVariable Long id, @RequestHeader(value = "X-Cart-Token", required = false) String token) {
        return view(service.get(id, token));
    }
}
