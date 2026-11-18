package com.projeto.carrinhoPraiagp02;

import com.projeto.carrinhoPraiagp02.models.Produto;
import com.projeto.carrinhoPraiagp02.repository.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.profiles.active=dev","app.security.enabled=false","app.test-orders.enabled=true"})
@AutoConfigureMockMvc @Transactional class TestPurchaseHttpIntegrationTest {
 @Autowired MockMvc mvc; @Autowired ProdutoRepo products; @Autowired PedidoRepo orders; @Autowired VendasRepo sales; @Autowired TestPurchaseRepo tests;
 @Test void remoteTestPurchaseIsPersistedWithoutRealOrderStockOrRevenue() throws Exception {
  Produto product=new Produto(); product.setNome("Produto demo");product.setDescricao("");product.setPreco(new BigDecimal("7.50"));product.setQuantidadeEstoque(9);product.setEstoqueMinimo(0);product.setCategoria("Teste");product.setDisponibilidade(true);product=products.save(product);
  long orderCount=orders.count(), salesCount=sales.count(); int stock=product.getQuantidadeEstoque();
  String body="{\"nomeCliente\":\"Apresentação\",\"mesaNumero\":4,\"itens\":[{\"produtoId\":"+product.getId()+",\"quantidade\":2}]}";
  var response=mvc.perform(post("/api/pedidos/testes").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated()).andExpect(jsonPath("$.origem").value("TESTE_REMOTO")).andExpect(jsonPath("$.valorTotal").value(15.0)).andReturn().getResponse().getContentAsString();
  var tree=new tools.jackson.databind.ObjectMapper().readTree(response); String id=tree.get("id").asText();
  mvc.perform(get("/api/pedidos/testes")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id)).andExpect(jsonPath("$[0].valorTotal").value(15.0)).andExpect(jsonPath("$[0].status").value("PENDENTE"));
  mvc.perform(patch("/api/pedidos/testes/{id}/status",id).param("status","EM_PREPARO")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("EM_PREPARO"));
  mvc.perform(patch("/api/pedidos/testes/{id}/status",id).param("status","PRONTO")).andExpect(status().isOk());
  mvc.perform(patch("/api/pedidos/testes/{id}/status",id).param("status","ENTREGUE")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ENTREGUE"));
  mvc.perform(patch("/api/pedidos/testes/{id}/status",id).param("status","EM_PREPARO")).andExpect(status().isConflict());
  mvc.perform(patch("/api/pedidos/testes/{id}/status",id).param("status","INVALIDO")).andExpect(status().isConflict());
  mvc.perform(get("/api/pedidos/testes")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id)).andExpect(jsonPath("$[0].valorTotal").value(15.0)).andExpect(jsonPath("$[0].status").value("ENTREGUE"));
  mvc.perform(get("/api/comandas/testes")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id)).andExpect(jsonPath("$[0].pedidos[0].id").value(id)).andExpect(jsonPath("$[0].status").value("FECHADA"));
  String cancelBody="{\"nomeCliente\":\"Cancelar\",\"itens\":[{\"produtoId\":"+product.getId()+",\"quantidade\":1}]}";
  var second=mvc.perform(post("/api/pedidos/testes").contentType(MediaType.APPLICATION_JSON).content(cancelBody)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
  String cancelId=new tools.jackson.databind.ObjectMapper().readTree(second).get("id").asText();
  mvc.perform(post("/api/pedidos/testes/{id}/cancelar",cancelId)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELADO"));
  mvc.perform(get("/api/pedidos/testes")).andExpect(status().isOk()).andExpect(jsonPath("$[1].status").value("CANCELADO"));
  mvc.perform(get("/api/comandas/testes")).andExpect(status().isOk()).andExpect(jsonPath("$[1].status").value("CANCELADA"));
  String snapshotBody="{\"nomeCliente\":\"Catálogo local\",\"itens\":[{\"nome\":\"Item offline\",\"precoUnitario\":3.25,\"quantidade\":3}]}";
  var snapshotResponse=mvc.perform(post("/api/pedidos/testes").contentType(MediaType.APPLICATION_JSON).content(snapshotBody)).andExpect(status().isCreated()).andExpect(jsonPath("$.valorTotal").value(9.75)).andExpect(jsonPath("$.itens[0].produto.nome").value("Item offline")).andReturn().getResponse().getContentAsString();
  String snapshotId=new tools.jackson.databind.ObjectMapper().readTree(snapshotResponse).get("id").asText();
  mvc.perform(get("/api/pedidos/testes")).andExpect(status().isOk()).andExpect(jsonPath("$[2].id").value(snapshotId)).andExpect(jsonPath("$[2].itens[0].precoUnitario").value(3.25));
  assertEquals(stock,products.findById(product.getId()).orElseThrow().getQuantidadeEstoque());assertEquals(orderCount,orders.count());assertEquals(salesCount,sales.count());
  String today=LocalDate.now().toString();mvc.perform(get("/api/relatorios/vendas/resumo?inicio="+today+"&fim="+today)).andExpect(status().isOk()).andExpect(jsonPath("$.quantidadeVendas").value(0));
 }
}
