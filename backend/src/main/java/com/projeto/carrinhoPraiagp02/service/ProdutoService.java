package com.projeto.carrinhoPraiagp02.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.projeto.carrinhoPraiagp02.models.Produto;
import com.projeto.carrinhoPraiagp02.repository.ProdutoRepo;
import com.projeto.carrinhoPraiagp02.repository.MovimentacaoRepo;
import com.projeto.carrinhoPraiagp02.models.Movimentacao;

@Service
@Transactional
public class ProdutoService {

    private final ProdutoRepo repo;
    private final MovimentacaoRepo movements;

    public ProdutoService(ProdutoRepo repo, MovimentacaoRepo movements) {
        this.repo = repo;
        this.movements = movements;
    }

    @Transactional(readOnly = true)
    public List<Produto> all() {
        return repo.findAll();
    }

    @Transactional(readOnly = true)
    public Produto get(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
    }

    public Produto save(Produto p) {
        if (p.getNome() == null || p.getNome().isBlank() || p.getCategoria() == null || p.getCategoria().isBlank()
                || p.getPreco() == null || p.getPreco().signum() <= 0 || p.getQuantidadeEstoque() == null || p.getQuantidadeEstoque() < 0
                || p.getEstoqueMinimo() == null || p.getEstoqueMinimo() < 0 || p.getDisponibilidade() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Os dados do produto são inválidos.");

        }
        Produto saved = repo.save(p);
        if (saved.getQuantidadeEstoque() > 0) {
            movements.save(new Movimentacao(saved, "ENTRADA", saved.getQuantidadeEstoque(), "system"));
        }
        return saved;
    }

    public Produto update(Long id, String nome, String descricao, String fotoUrl, java.math.BigDecimal preco, Integer stock, Integer minimum, String category, Boolean available) {
        Produto current = get(id);
        if (!current.getQuantidadeEstoque().equals(stock)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Altere o estoque pelo recurso de movimentação de estoque.");
        }
        if (nome == null || nome.isBlank() || category == null || category.isBlank() || stock == null || stock < 0
                || minimum == null || minimum < 0 || preco == null || preco.signum() <= 0 || available == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Os dados do produto são inválidos.");
        }
        current.setNome(nome);
        current.setDescricao(descricao);
        current.setFotoUrl(fotoUrl);
        current.setPreco(preco);
        current.setEstoqueMinimo(minimum);
        current.setCategoria(category);
        current.setDisponibilidade(available);
        return saveExisting(current);
    }

    private Produto saveExisting(Produto product) {
        if (product.getNome() == null || product.getNome().isBlank() || product.getCategoria() == null || product.getCategoria().isBlank()
                || product.getPreco() == null || product.getPreco().signum() <= 0 || product.getQuantidadeEstoque() == null
                || product.getQuantidadeEstoque() < 0 || product.getEstoqueMinimo() == null || product.getEstoqueMinimo() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Os dados do produto são inválidos.");
        }return repo.save(product);
    }

    public void delete(Long id) {
        Produto product = get(id);
        product.setDisponibilidade(false);
        repo.save(product);
    }
}
