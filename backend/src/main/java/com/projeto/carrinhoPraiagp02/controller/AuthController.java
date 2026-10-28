package com.projeto.carrinhoPraiagp02.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager manager;
    private final SecurityContextRepository contextRepo;

    public AuthController(AuthenticationManager m, SecurityContextRepository r) {
        manager = m;
        contextRepo = r;
    }

    record Login(@NotBlank
            @Email String email, @NotBlank String senha) {}

    record Result(String email, String role, String message) {}

    record Csrf(String token) {}

    @GetMapping("/csrf")
    public Csrf csrf(CsrfToken token) {
        return new Csrf(token.getToken());
    }

    @PostMapping("/login")
    public Result login(@Valid @RequestBody Login login, HttpServletRequest request, HttpServletResponse response) {
        Authentication a = manager.authenticate(new UsernamePasswordAuthenticationToken(login.email(), login.senha()));
        if (request.getSession(false) != null) request.changeSessionId();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(a);
        SecurityContextHolder.setContext(context);
        contextRepo.saveContext(context, request, response);
        return new Result(a.getName(), a.getAuthorities().iterator().next().getAuthority(), "Autenticado");
    }

    @GetMapping("/me")
    public Result me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "Autenticação necessária.");

        }
        return new Result(auth.getName(), auth.getAuthorities().iterator().next().getAuthority(), "Autenticado");
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();

        }
        contextRepo.saveContext(SecurityContextHolder.createEmptyContext(), request, response);
    }
}
