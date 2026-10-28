package com.projeto.carrinhoPraiagp02.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;
import com.projeto.carrinhoPraiagp02.models.Usuario;
import com.projeto.carrinhoPraiagp02.repository.UsuarioRepo;

@Component
@Profile("dev")
public class DevAdminBootstrap implements ApplicationRunner {

    private final UsuarioRepo users;
    private final PasswordEncoder encoder;
    @Value("${app.bootstrap-admin.enabled:false}")
    private boolean enabled;
    @Value("${app.bootstrap-admin.email:admin@localhost}")
    private String email;
    @Value("${app.bootstrap-admin.password:}")
    private String password;

    public DevAdminBootstrap(UsuarioRepo users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled || users.count() != 0) {
            return;
        }
        if(password==null||password.isBlank()) throw new IllegalStateException("Set APP_BOOTSTRAP_ADMIN_PASSWORD to enable development administrator bootstrap");
        Usuario admin = new Usuario();
        admin.setNome("Administrador de desenvolvimento");
        admin.setEmail(email);
        admin.setDocumento("DEV-BOOTSTRAP-ADMIN");
        admin.setSenha(encoder.encode(password));
        admin.setCargo("ADMIN");
        users.save(admin);
    }
}
