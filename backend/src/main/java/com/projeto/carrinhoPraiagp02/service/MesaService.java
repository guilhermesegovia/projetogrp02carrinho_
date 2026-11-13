package com.projeto.carrinhoPraiagp02.service;
import com.projeto.carrinhoPraiagp02.models.Mesa;
import com.projeto.carrinhoPraiagp02.repository.MesaRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
@Service public class MesaService {
 private final MesaRepo repo;
 @Value("${app.public-base-url:}") private String baseUrl;
 public MesaService(MesaRepo repo){this.repo=repo;}
 public List<Mesa> all(){return repo.findAll();}
 public Mesa create(int numero){if(numero<1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Número da mesa deve ser positivo."); if(repo.existsByNumero(numero)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Número de mesa já cadastrado."); return repo.save(new Mesa(numero));}
 public Mesa token(String token){return repo.findByToken(token).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Mesa não encontrada."));}
 public String target(Mesa mesa,String origin){String base=baseUrl==null||baseUrl.isBlank()?origin:baseUrl; if(base==null||base.isBlank()) base="http://localhost:8080"; return base.replaceAll("/$","")+"/cardapio.html?mesa="+mesa.getToken();}
}
