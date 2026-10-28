package com.projeto.carrinhoPraiagp02.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projeto.carrinhoPraiagp02.models.Pedido;

public interface PedidoRepo extends JpaRepository<Pedido, Long> {

    @Override
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"itens", "itens.produto", "comanda"})
    java.util.List<Pedido> findAll();

    @Override
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"itens", "itens.produto", "comanda"})
    java.util.Optional<Pedido> findById(Long id);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Pedido p where p.id = :id")
    java.util.Optional<Pedido> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"itens", "itens.produto", "comanda"})
    java.util.List<Pedido> findByComandaNumero(String numero);
}
