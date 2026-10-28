package com.projeto.carrinhoPraiagp02.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.projeto.carrinhoPraiagp02.models.Pagamento;
import com.projeto.carrinhoPraiagp02.repository.PagamentoRepo;

@Service
@Transactional(readOnly = true)
public class PagamentoService {

    private final PagamentoRepo repo;

    public PagamentoService(PagamentoRepo r) {
        repo = r;
    }

    public List<Pagamento> all() {
        return repo.findAll();
    }

    public Pagamento get(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado."));
    }
}
