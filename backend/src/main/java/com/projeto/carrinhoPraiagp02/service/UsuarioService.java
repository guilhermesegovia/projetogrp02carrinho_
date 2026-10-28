package com.projeto.carrinhoPraiagp02.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.projeto.carrinhoPraiagp02.models.Usuario;
import com.projeto.carrinhoPraiagp02.repository.UsuarioRepo;

@Service
@Transactional
public class UsuarioService {

    private final UsuarioRepo repo;
    private final PasswordEncoder encoder;

    public UsuarioService(UsuarioRepo repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<Usuario> all() {
        return repo.findAll();
    }

    @Transactional(readOnly = true)
    public Usuario get(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    public Usuario create(String nome, String email, String documento, String senha, String role) {
        if (repo.existsByEmailIgnoreCase(email) || repo.existsByDocumento(documento)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ou documento já cadastrado.");
        }
        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email.toLowerCase());
        u.setDocumento(documento);
        u.setSenha(encoder.encode(senha));
        u.setCargo(normalize(role));
        return repo.save(u);
    }

    public Usuario update(Long id, String nome, String email, String documento, String senha, String role) {
        Usuario u = get(id);
        if (repo.findByEmailIgnoreCase(email).filter(x -> !x.getId().equals(id)).isPresent() || repo.existsByDocumento(documento) && !u.getDocumento().equals(documento)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ou documento já cadastrado.");
        }
        u.setNome(nome);
        u.setEmail(email.toLowerCase());
        u.setDocumento(documento);
        if (senha != null && !senha.isBlank()) {
            u.setSenha(encoder.encode(senha));

        }
        u.setCargo(normalize(role));
        return u;
    }

    public void delete(Long id) {
        repo.delete(get(id));
    }

    private String normalize(String role) {
        String r = role == null ? "" : role.toUpperCase();
        if (!List.of("ADMIN", "FUNCIONARIO").contains(r)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O cargo deve ser ADMIN ou FUNCIONARIO.");

        }
        return r;
    }
}
