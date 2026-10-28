package com.projeto.carrinhoPraiagp02.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projeto.carrinhoPraiagp02.models.Produto;

public interface ProdutoRepo extends JpaRepository<Produto, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Produto p where p.id = :id")
    java.util.Optional<Produto> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);
}
