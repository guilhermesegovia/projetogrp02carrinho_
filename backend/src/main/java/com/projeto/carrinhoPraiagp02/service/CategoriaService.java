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
        if (categoriaRepo.existsByDocumento(categoria.getDocumento())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria já existe");
        }
        return categoriaRepo.save(categoria);
    }

    public Categoria atualizarCategoria(Long id, Categoria categoriaAtualizada) {
        Categoria categoriaExistente = categoriaRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));

        categoriaExistente.setNome(categoriaAtualizada.getNome());
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

}
