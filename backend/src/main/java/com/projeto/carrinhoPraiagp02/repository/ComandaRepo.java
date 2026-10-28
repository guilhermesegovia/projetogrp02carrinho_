package com.projeto.carrinhoPraiagp02.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projeto.carrinhoPraiagp02.models.Comanda;

public interface ComandaRepo extends JpaRepository<Comanda, Long> {

    java.util.Optional<Comanda> findByNumero(String numero);

    boolean existsByNumero(String numero);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Comanda c where c.numero=:numero")
    java.util.Optional<Comanda> findLockedByNumero(@org.springframework.data.repository.query.Param("numero") String numero);
}
