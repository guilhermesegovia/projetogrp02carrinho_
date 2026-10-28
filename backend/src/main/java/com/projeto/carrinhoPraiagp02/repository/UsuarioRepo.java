package com.projeto.carrinhoPraiagp02.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projeto.carrinhoPraiagp02.models.Usuario;

public interface UsuarioRepo extends JpaRepository<Usuario, Long> {

    boolean existsByDocumento(String documento);

    java.util.Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
