package com.projeto.carrinhoPraiagp02.config;

import com.projeto.carrinhoPraiagp02.models.Usuario;
import com.projeto.carrinhoPraiagp02.repository.UsuarioRepo;
import java.nio.charset.StandardCharsets;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean UserDetailsService userDetailsService(UsuarioRepo usuarios) {
        return email -> {
            Usuario u = usuarios.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
            return User.withUsername(u.getEmail()).password(u.getSenha()).roles(u.getCargo()).build();
        };
    }

    @Bean DaoAuthenticationProvider authenticationProvider(UserDetailsService users, PasswordEncoder encoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(encoder);
        return provider;
    }

    @Bean AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean SecurityContextRepository securityContextRepository() { return new HttpSessionSecurityContextRepository(); }

    @Bean
    @ConditionalOnProperty(name = "app.security.enabled", havingValue = "false")
    SecurityFilterChain localSecurityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .logout(logout -> logout.disable())
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.security.enabled", havingValue = "true", matchIfMissing = true)
    SecurityFilterChain authenticatedSecurityFilterChain(HttpSecurity http, DaoAuthenticationProvider provider,
            SecurityContextRepository contextRepository) throws Exception {
        return http.authenticationProvider(provider)
                .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .securityContext(context -> context.securityContextRepository(contextRepository).requireExplicitSave(true))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/index.html", "/cardapio.html", "/admin", "/assets/**", "/favicon.ico", "/favicon.png", "/robots.txt",
                                "/app.css", "/app.js", "/menu.js", "/store.js", "/logo.png").permitAll()
                        .requestMatchers("/api/auth/**", "/api/produtos/**", "/api/categorias/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/comandas/cliente").permitAll()
                        .requestMatchers("/api/comandas/**").hasAnyRole("ADMIN", "FUNCIONARIO")
                        .requestMatchers("/api/vendas/**", "/api/pagamentos/**", "/api/relatorios/**").hasRole("ADMIN")
                        .requestMatchers("/api/pedidos/*/tracking").permitAll()
                        .requestMatchers("/api/pedidos/**").hasAnyRole("ADMIN", "FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/api/carrinhos").hasAnyRole("ADMIN", "FUNCIONARIO")
                        .requestMatchers("/api/carrinhos/**").permitAll()
                        .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                        .requestMatchers("/api/estoque/**").hasAnyRole("ADMIN", "FUNCIONARIO")
                        .requestMatchers("/api/**").hasAnyRole("ADMIN", "FUNCIONARIO")
                        .anyRequest().denyAll())
                .httpBasic(basic -> basic.authenticationEntryPoint((request, response, exception) -> {
                    response.setStatus(401);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                    response.getWriter().write("{\"status\":401,\"error\":\"Não autorizado\",\"message\":\"Autenticação necessária.\"}");
                }))
                .exceptionHandling(errors -> errors.accessDeniedHandler((request, response, exception) -> {
                    response.setStatus(403);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                    response.getWriter().write("{\"status\":403,\"error\":\"Acesso proibido\",\"message\":\"Você não tem permissão para acessar este recurso.\"}");
                }))
                .build();
    }
}
