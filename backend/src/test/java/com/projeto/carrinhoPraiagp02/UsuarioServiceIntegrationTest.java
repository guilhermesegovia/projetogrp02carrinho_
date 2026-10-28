package com.projeto.carrinhoPraiagp02;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import com.projeto.carrinhoPraiagp02.repository.UsuarioRepo;
import com.projeto.carrinhoPraiagp02.service.UsuarioService;

@SpringBootTest @Transactional class UsuarioServiceIntegrationTest {
    @Autowired UsuarioService users;
    @Autowired UsuarioRepo repo;
    @Autowired PasswordEncoder encoder;

    @Test void userPasswordIsPersistedAsBcryptHash() {
        var user = users.create("Admin","admin@example.test","ID-A","secret-password","ADMIN");
        var stored = repo.findById(user.getId()).orElseThrow().getSenha();
        assertNotEquals("secret-password",stored);
        assertTrue(stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$"));
        assertTrue(encoder.matches("secret-password",stored));
    }
}
