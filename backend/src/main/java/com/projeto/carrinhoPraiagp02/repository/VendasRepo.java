package com.projeto.carrinhoPraiagp02.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projeto.carrinhoPraiagp02.models.Vendas;

public interface VendasRepo extends JpaRepository<Vendas, Long> {

    boolean existsByPedidoId(Long pedidoId);
}
