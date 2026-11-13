package com.projeto.carrinhoPraiagp02.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.projeto.carrinhoPraiagp02.models.Comanda;
import com.projeto.carrinhoPraiagp02.repository.ComandaRepo;

@Service
@Transactional
public class ComandaService {

    private final ComandaRepo repo;
    private final com.projeto.carrinhoPraiagp02.repository.PedidoRepo orders;
    private final com.projeto.carrinhoPraiagp02.repository.MesaRepo mesas;

    public ComandaService(ComandaRepo r, com.projeto.carrinhoPraiagp02.repository.PedidoRepo orders, com.projeto.carrinhoPraiagp02.repository.MesaRepo mesas) {
        repo = r;
        this.orders = orders;
        this.mesas = mesas;
    }

    public List<Comanda> all() {
        return repo.findAll();
    }

    public Comanda get(String n) {
        return repo.findByNumero(n).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comanda não encontrada."));
    }

    public List<com.projeto.carrinhoPraiagp02.models.Pedido> orders(String n) {
        get(n);
        return orders.findByComandaNumero(n);
    }

    public Comanda open(String n, String client) {
        if (repo.existsByNumero(n)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este número de comanda já está em uso.");
        }return repo.save(new Comanda(n, client));
    }

    public Comanda openForCustomer(String client) {
        return openForCustomer(client, null);
    }

    public Comanda openForCustomer(String client, String mesaToken) {
        String number;
        do {
            number = "C-" + java.util.UUID.randomUUID();
        } while (repo.existsByNumero(number));
        Comanda comanda = new Comanda(number, client);
        if (mesaToken != null && !mesaToken.isBlank()) comanda.setMesa(mesas.findByToken(mesaToken).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mesa não encontrada.")));
        return repo.save(comanda);
    }

    public Comanda close(String n) {
        Comanda c = repo.findLockedByNumero(n).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comanda não encontrada."));
        if (!c.getStatus().equals("ABERTA")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A comanda já está fechada.");
        }c.fechar();
        return c;
    }
}
