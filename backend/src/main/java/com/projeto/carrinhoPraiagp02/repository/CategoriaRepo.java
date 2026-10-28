package com.projeto.carrinhoPraiagp02.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projeto.carrinhoPraiagp02.models.Categoria;

public interface CategoriaRepo extends JpaRepository<Categoria, Long> {

    boolean existsByDocumento(String documento);
}
