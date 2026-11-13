package com.projeto.carrinhoPraiagp02;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.math.BigDecimal;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.projeto.carrinhoPraiagp02.models.Produto;
import com.projeto.carrinhoPraiagp02.repository.*;
import com.projeto.carrinhoPraiagp02.service.PedidoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties={"spring.profiles.active=dev","app.security.enabled=false"})
@AutoConfigureMockMvc @Transactional class MesaCheckoutHttpIntegrationTest {
 @Autowired MockMvc mvc; @Autowired ObjectMapper json; @Autowired ProdutoRepo products; @Autowired MesaRepo mesas; @Autowired ComandaRepo comandas; @Autowired PedidoRepo pedidos; @Autowired PedidoService pedidoService;
 @Test void mesaPublicCustomerCheckoutAndQrFlow() throws Exception {
  mvc.perform(post("/api/mesas").contentType(MediaType.APPLICATION_JSON).content("{\"numero\":-1}")).andExpect(status().isBadRequest());
  JsonNode mesa=json.readTree(mvc.perform(post("/api/mesas").contentType(MediaType.APPLICATION_JSON).content("{\"numero\":47}")).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
  assertNotNull(mesa.get("token")); assertEquals(64,mesa.get("token").asText().length());
  mvc.perform(post("/api/mesas").contentType(MediaType.APPLICATION_JSON).content("{\"numero\":47}")).andExpect(status().isConflict());
  mvc.perform(get("/api/mesas/publico/"+mesa.get("token").asText())).andExpect(status().isOk()).andExpect(jsonPath("$.numero").value(47)).andExpect(jsonPath("$.token").doesNotExist());
  mvc.perform(get("/api/mesas/publico/invalid")).andExpect(status().isNotFound());
  mvc.perform(get("/api/mesas/"+mesa.get("id").asLong()+"/qrcode.png")).andExpect(status().isOk()).andExpect(content().contentType("image/png"));
  mvc.perform(get("/api/mesas/qrcodes.zip")).andExpect(status().isOk()).andExpect(content().contentType("application/zip"));
  JsonNode comanda=json.readTree(mvc.perform(post("/api/comandas/cliente").contentType(MediaType.APPLICATION_JSON).content("{\"nomeCliente\":\"Cliente QR\",\"mesaToken\":\""+mesa.get("token").asText()+"\"}")).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
  var c=comandas.findByNumero(comanda.get("numero").asText()).orElseThrow(); assertEquals("Cliente QR",c.getNomeCliente()); assertEquals(mesa.get("id").asLong(),c.getMesa().getId());
  Produto p=new Produto();p.setNome("Suco QR");p.setDescricao("");p.setPreco(new BigDecimal("5.25"));p.setQuantidadeEstoque(4);p.setEstoqueMinimo(0);p.setCategoria("Bebida");p.setDisponibilidade(true);p=products.save(p);
  JsonNode cart=json.readTree(mvc.perform(post("/api/carrinhos").contentType(MediaType.APPLICATION_JSON).content("{\"comandaNumero\":\""+c.getNumero()+"\"}")).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
  mvc.perform(post("/api/carrinhos/"+cart.get("id").asLong()+"/itens").header("X-Cart-Token",cart.get("accessToken").asText()).contentType(MediaType.APPLICATION_JSON).content("{\"produtoId\":"+p.getId()+",\"quantidade\":2}")).andExpect(status().isOk());
  JsonNode result=json.readTree(mvc.perform(post("/api/carrinhos/"+cart.get("id").asLong()+"/checkout").header("X-Cart-Token",cart.get("accessToken").asText()).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
   var order=pedidos.findById(result.get("pedidoId").asLong()).orElseThrow(); assertEquals("PENDENTE",order.getStatus());assertEquals(new BigDecimal("10.50"),order.getValorTotal());assertEquals("Cliente QR",order.getComanda().getNomeCliente());assertEquals(47,order.getComanda().getMesa().getNumero());assertEquals("Suco QR",order.getItens().get(0).getProduto().getNome());assertEquals(2,order.getItens().get(0).getQuantidade());assertEquals(2,products.findById(p.getId()).orElseThrow().getQuantidadeEstoque());
   mvc.perform(get("/api/pedidos")).andExpect(status().isOk()).andExpect(jsonPath("$[0].comanda.nomeCliente").value("Cliente QR")).andExpect(jsonPath("$[0].comanda.mesa.numero").value(47)).andExpect(jsonPath("$[0].itens[0].produto.nome").value("Suco QR")).andExpect(jsonPath("$[0].valorTotal").value(10.5)).andExpect(jsonPath("$[0].status").value("PENDENTE"));
 }
 @Test void allowsForwardSelectionButRejectsBackwardAndTerminalChanges() throws Exception {
  var c=comandas.save(new com.projeto.carrinhoPraiagp02.models.Comanda("STATUS-TEST","Test"));var order=pedidos.save(new com.projeto.carrinhoPraiagp02.models.Pedido(c,BigDecimal.ONE));
  assertEquals("PRONTO",pedidoService.updateStatus(order.getId(),"PRONTO").getStatus());assertThrows(RuntimeException.class,()->pedidoService.updateStatus(order.getId(),"EM_PREPARO"));assertEquals("ENTREGUE",pedidoService.updateStatus(order.getId(),"ENTREGUE").getStatus());assertThrows(RuntimeException.class,()->pedidoService.updateStatus(order.getId(),"PRONTO"));
 }
}
