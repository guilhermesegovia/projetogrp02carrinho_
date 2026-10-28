package com.projeto.carrinhoPraiagp02.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projeto.carrinhoPraiagp02.models.Pagamento;

public interface PagamentoRepo extends JpaRepository<Pagamento, Long> {

    boolean existsByPedidoId(Long pedidoId);

    java.util.Optional<Pagamento> findByPedidoId(Long pedidoId);
}
