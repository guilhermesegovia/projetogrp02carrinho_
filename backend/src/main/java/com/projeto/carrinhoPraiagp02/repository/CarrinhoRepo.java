package com.projeto.carrinhoPraiagp02.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projeto.carrinhoPraiagp02.models.Carrinho;

public interface CarrinhoRepo extends JpaRepository<Carrinho, Long> {

    @Override
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"itens", "itens.produto"})
    java.util.Optional<Carrinho> findById(Long id);

    @Override
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"itens", "itens.produto"})
    java.util.List<Carrinho> findAll();

    java.util.Optional<Carrinho> findByComandaNumero(String numero);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select distinct c from Carrinho c left join fetch c.itens i left join fetch i.produto where c.id = :id")
    java.util.Optional<Carrinho> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);
}
