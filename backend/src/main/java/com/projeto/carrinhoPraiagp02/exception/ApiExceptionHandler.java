package com.projeto.carrinhoPraiagp02.exception;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.authorization.AuthorizationDeniedException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(PaymentDeclinedException.class)
    ResponseEntity<?> declined(PaymentDeclinedException exception) {
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of("timestamp", LocalDateTime.now(), "status", 402, "error", "Pagamento necessário", "message", exception.getMessage()));
    }

    @ExceptionHandler(AuthorizationDeniedException.class)
    ResponseEntity<?> denied(AuthorizationDeniedException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("timestamp", LocalDateTime.now(), "status", 403,
                "error", "Proibido", "message", "Acesso negado"));
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        return ResponseEntity.status(status).body(Map.of("timestamp", LocalDateTime.now(), "status", status.value(),
                "error", localizedStatus(status), "message", exception.getReason() == null ? localizedStatus(status) : exception.getReason()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> invalid(MethodArgumentNotValidException exception) {
        Map<String, String> errors = exception.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField, e -> e.getDefaultMessage() == null ? "Valor inválido." : e.getDefaultMessage(), (a, b) -> a));
        return ResponseEntity.badRequest().body(Map.of("timestamp", LocalDateTime.now(), "status", 400,
                "error", "Requisição inválida", "message", "Verifique os dados informados.", "details", errors));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<?> resourceNotFound(NoResourceFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("timestamp", LocalDateTime.now(),
                "status", HttpStatus.NOT_FOUND.value(), "error", "Não encontrado",
                "message", "O recurso solicitado não existe."));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unexpected(Exception exception) {
        return ResponseEntity.status(500).body(Map.of("timestamp", LocalDateTime.now(), "status", 500,
                "error", "Erro interno do servidor", "message", "Não foi possível concluir a solicitação."));
    }

    private String localizedStatus(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "Requisição inválida";
            case UNAUTHORIZED -> "Não autorizado";
            case FORBIDDEN -> "Acesso proibido";
            case NOT_FOUND -> "Não encontrado";
            case CONFLICT -> "Conflito";
            case PAYMENT_REQUIRED -> "Pagamento necessário";
            default -> "Erro na solicitação";
        };
    }
}
