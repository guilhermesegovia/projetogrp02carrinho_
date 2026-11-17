package com.projeto.carrinhoPraiagp02.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projeto.carrinhoPraiagp02.models.Mesa;

public interface MesaRepo extends JpaRepository<Mesa, Long> {

    Optional<Mesa> findByToken(String token);

    boolean existsByNumero(Integer numero);
}
