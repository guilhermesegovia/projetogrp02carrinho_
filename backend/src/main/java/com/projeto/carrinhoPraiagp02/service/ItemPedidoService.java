package com.projeto.carrinhoPraiagp02.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.projeto.carrinhoPraiagp02.models.ItemPedido;
import com.projeto.carrinhoPraiagp02.repository.ItemPedidoRepo;

@Service
@Transactional(readOnly = true)
public class ItemPedidoService {

    private final ItemPedidoRepo repo;

    public ItemPedidoService(ItemPedidoRepo r) {
        repo = r;
    }

    public List<ItemPedido> all() {
        return repo.findAll();
    }
}
