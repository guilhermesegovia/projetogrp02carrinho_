package com.projeto.carrinhoPraiagp02.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.projeto.carrinhoPraiagp02.models.Pedido;
import com.projeto.carrinhoPraiagp02.repository.PedidoRepo;

@Service
@Transactional
public class PedidoService {

    private final PedidoRepo repo;

    public PedidoService(PedidoRepo r) {
        repo = r;
    }

    public List<Pedido> all() {
        return repo.findAll();
    }

    public Pedido get(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));
    }

    public Pedido updateStatus(Long id, String status) {
        Pedido p = get(id);
        List<String> flow = List.of("PENDENTE", "EM_PREPARO", "PRONTO", "ENTREGUE");
        int current = flow.indexOf(p.getStatus());
        if (current < 0 || current == flow.size() - 1 || !flow.contains(status) || flow.indexOf(status) <= current) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A mudança de status do pedido não é permitida.");
        }p.status(status);
        return p;
    }

    public Pedido tracking(Long id, String token) {
        Pedido p = get(id);
        if (token == null || !MessageDigest.isEqual(p.getTrackingToken().getBytes(StandardCharsets.UTF_8), token.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "O token de acompanhamento é inválido.");
        }return p;
    }
}
