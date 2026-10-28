package com.projeto.carrinhoPraiagp02.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.projeto.carrinhoPraiagp02.models.Vendas;
import com.projeto.carrinhoPraiagp02.repository.VendasRepo;

@Service
@Transactional(readOnly = true)
public class VendasService {

    private final VendasRepo repo;

    public VendasService(VendasRepo r) {
        repo = r;
    }

    public List<Vendas> all() {
        return repo.findAll().stream().filter(v -> !v.getPedido().getStatus().equals("CANCELADO")).toList();
    }
}
