package com.projeto.carrinhoPraiagp02.controller;

import com.projeto.carrinhoPraiagp02.models.*;
import com.projeto.carrinhoPraiagp02.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
public class TestPurchaseController {
    private final TestPurchaseRepo purchases; private final ProdutoRepo products; private final boolean enabled;
    public TestPurchaseController(TestPurchaseRepo purchases, ProdutoRepo products, @Value("${app.test-orders.enabled:false}") boolean enabled){this.purchases=purchases;this.products=products;this.enabled=enabled;}
    public record ItemRequest(@NotNull Long produtoId,@NotNull @Min(1) @Max(1000) Integer quantidade){}
    public record PurchaseRequest(@NotBlank @Size(max=100) String nomeCliente,@Positive Integer mesaNumero,@NotEmpty @Size(max=50) List<@Valid ItemRequest> itens){}
    public record ProductDTO(Long id,String nome){}
    public record OrderItem(ProductDTO produto,Integer quantidade,BigDecimal precoUnitario){}
    public record TableDTO(Integer numero){}
    public record OrderDTO(String id,String numero,String origem,LocalDateTime data,String status,BigDecimal valorTotal,List<OrderItem> itens,ComandaDTO comanda){}
    public record ComandaDTO(String numero,String nomeCliente,TableDTO mesa){}
    public record TestComanda(String id,String numero,String origem,String nomeCliente,LocalDateTime dataAbertura,String status,BigDecimal valorTotal,TableDTO mesa,List<OrderDTO> pedidos){}
    @PostMapping("/api/pedidos/testes") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public OrderDTO create(@Valid @RequestBody PurchaseRequest request){
        if(!enabled) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        TestPurchase p=new TestPurchase(request.nomeCliente().trim(),request.mesaNumero());
        for(ItemRequest i:request.itens()) { Produto product=products.findById(i.produtoId()).orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST,"Produto inexistente")); if(!Boolean.TRUE.equals(product.getDisponibilidade())||product.getQuantidadeEstoque()<i.quantidade()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Produto indisponível ou estoque insuficiente"); p.add(new TestPurchaseItem(product.getId(),product.getNome(),i.quantidade(),product.getPreco())); }
        return order(purchases.save(p));
    }
    @GetMapping("/api/pedidos/testes") public List<OrderDTO> orders(){return purchases.findAll().stream().map(this::order).toList();}
    @PatchMapping("/api/pedidos/testes/{id}/status") @Transactional
    public OrderDTO status(@PathVariable String id,@RequestParam String status){TestPurchase p=find(id);List<String> flow=List.of("PENDENTE","EM_PREPARO","PRONTO","ENTREGUE");int current=flow.indexOf(p.getStatus());if(current<0||current==flow.size()-1||!flow.contains(status)||flow.indexOf(status)<=current)throw new ResponseStatusException(HttpStatus.CONFLICT,"A mudança de status do pedido não é permitida.");p.setStatus(status);return order(p);}
    @PostMapping("/api/pedidos/testes/{id}/cancelar") @Transactional
    public OrderDTO cancel(@PathVariable String id){TestPurchase p=find(id);if(List.of("ENTREGUE","CANCELADO").contains(p.getStatus()))throw new ResponseStatusException(HttpStatus.CONFLICT,"O pedido não pode ser cancelado.");p.setStatus("CANCELADO");return order(p);}
    @GetMapping("/api/comandas/testes") public List<TestComanda> comandas(){return purchases.findAll().stream().map(p->{TableDTO table=p.getMesaNumero()==null?null:new TableDTO(p.getMesaNumero());String id="TESTE-"+p.getId();String commandStatus="CANCELADO".equals(p.getStatus())?"CANCELADA":"ENTREGUE".equals(p.getStatus())?"FECHADA":"ABERTA";return new TestComanda(id,id,"TESTE_REMOTO",p.getNomeCliente(),p.getData(),commandStatus,p.getValorTotal(),table,List.of(order(p)));}).toList();}
    private TestPurchase find(String value){if(value==null||!value.matches("TESTE-[1-9][0-9]*"))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Pedido de teste não encontrado.");try{return purchases.findById(Long.parseLong(value.substring(6))).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Pedido de teste não encontrado."));}catch(NumberFormatException ex){throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Pedido de teste não encontrado.");}}
    private OrderDTO order(TestPurchase p){String id="TESTE-"+p.getId();TableDTO table=p.getMesaNumero()==null?null:new TableDTO(p.getMesaNumero());ComandaDTO c=new ComandaDTO(id,p.getNomeCliente(),table);List<OrderItem> items=p.getItens().stream().map(i->new OrderItem(new ProductDTO(i.getProdutoId(),i.getNomeProduto()),i.getQuantidade(),i.getPrecoUnitario())).toList();return new OrderDTO(id,id,"TESTE_REMOTO",p.getData(),p.getStatus(),p.getValorTotal(),items,c);}
}
