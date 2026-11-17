package com.projeto.carrinhoPraiagp02;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.http.MediaType;
@SpringBootTest(properties={"spring.profiles.active=dev","app.security.enabled=false","app.test-orders.enabled=false"})
@AutoConfigureMockMvc class TestPurchaseDisabledHttpIntegrationTest {
 @Autowired MockMvc mvc;
 @Test void creationIsRejectedWhenFeatureDisabled() throws Exception {
  mvc.perform(post("/api/pedidos/testes").contentType(MediaType.APPLICATION_JSON).content("{\"nomeCliente\":\"Teste\",\"itens\":[{\"produtoId\":1,\"quantidade\":1}]}" )).andExpect(status().isNotFound());
 }
}
