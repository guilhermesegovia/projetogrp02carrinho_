package com.projeto.carrinhoPraiagp02.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.projeto.carrinhoPraiagp02.models.Categoria;
import com.projeto.carrinhoPraiagp02.repository.CategoriaRepo;

@Service
@Transactional
public class CategoriaService {

    private final CategoriaRepo categoriaRepo;

    public CategoriaService(CategoriaRepo categoriaRepo) {
        this.categoriaRepo = categoriaRepo;
    }

    public Categoria criarCategoria(Categoria categoria) {
        categoria.setNome(normalizeName(categoria.getNome()));
        if (categoriaRepo.findAll().stream().anyMatch(existing -> nameKey(existing.getNome()).equals(nameKey(categoria.getNome())))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria já existe");
        }
        return categoriaRepo.save(categoria);
    }

    public Categoria atualizarCategoria(Long id, Categoria categoriaAtualizada) {
        Categoria categoriaExistente = categoriaRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));

        String normalizedName = normalizeName(categoriaAtualizada.getNome());
        if (categoriaRepo.findAll().stream().anyMatch(existing -> !existing.getId().equals(id)
                && nameKey(existing.getNome()).equals(nameKey(normalizedName)))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria já existe");
        }
        categoriaExistente.setNome(normalizedName);
        categoriaExistente.setDescricao(categoriaAtualizada.getDescricao());

        return categoriaRepo.save(categoriaExistente);
    }

    public List<Categoria> listarCategorias() {
        return categoriaRepo.findAll();
    }

    public Categoria obter(Long id) {
        return categoriaRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));
    }

    public void excluir(Long id) {
        categoriaRepo.delete(obter(id));
    }

    private String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O nome da categoria é obrigatório");
        }
        return name.strip().replaceAll("\\s+", " ");
    }

    private String nameKey(String name) {
        return normalizeName(name).toLowerCase(java.util.Locale.ROOT);
    }

}
