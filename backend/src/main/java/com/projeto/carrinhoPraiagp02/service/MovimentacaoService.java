package com.projeto.carrinhoPraiagp02.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.projeto.carrinhoPraiagp02.models.Movimentacao;
import com.projeto.carrinhoPraiagp02.models.Produto;
import com.projeto.carrinhoPraiagp02.repository.MovimentacaoRepo;
import com.projeto.carrinhoPraiagp02.repository.ProdutoRepo;

@Service
@Transactional
public class MovimentacaoService {

    private final ProdutoRepo products;
    private final MovimentacaoRepo movements;

    public MovimentacaoService(ProdutoRepo products, MovimentacaoRepo movements) {
        this.products = products;
        this.movements = movements;
    }

    public Movimentacao change(Long productId, String type, int quantity, String actor) {
        if (quantity < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A quantidade não pode ser negativa.");
        }
        Produto p = products.findLockedById(productId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        int current = p.getQuantidadeEstoque();
        String normalized = type == null ? "" : type.toUpperCase(java.util.Locale.ROOT);
        int amount;
        switch (normalized) {
            case "ENTRADA" -> {
                if (quantity <= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A quantidade de entrada deve ser maior que zero.");

                }
                p.ajustarEstoque(Math.addExact(current, quantity));
                amount = quantity;
            }
            case "SAIDA" -> {
                if (quantity <= 0 || quantity > current) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "A saída excede o estoque disponível.");

                }
                p.ajustarEstoque(current - quantity);
                amount = quantity;
            }
            case "AJUSTE" -> {
                amount = Math.abs(quantity - current);
                if (amount == 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O estoque já está na quantidade solicitada.");

                }
                p.ajustarEstoque(quantity);
                normalized = quantity > current ? "ENTRADA" : "SAIDA";
            }
            default ->
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O tipo de movimentação deve ser ENTRADA, SAIDA ou AJUSTE.");
        }
        return movements.save(new Movimentacao(p, normalized, amount, actor == null ? "system" : actor));
    }

    @Transactional(readOnly = true)
    public List<Movimentacao> all() {
        return movements.findAll();
    }

    @Transactional(readOnly = true)
    public List<Produto> lowStock() {
        return products.findAll().stream().filter(p -> p.getQuantidadeEstoque() < p.getEstoqueMinimo()).toList();
    }
}
