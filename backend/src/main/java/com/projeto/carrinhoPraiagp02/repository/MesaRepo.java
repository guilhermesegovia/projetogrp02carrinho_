package com.projeto.carrinhoPraiagp02.repository;
import com.projeto.carrinhoPraiagp02.models.Mesa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface MesaRepo extends JpaRepository<Mesa,Long> { Optional<Mesa> findByToken(String token); boolean existsByNumero(Integer numero); }
