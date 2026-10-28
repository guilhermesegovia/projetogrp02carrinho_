package com.projeto.carrinhoPraiagp02;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import java.util.regex.Pattern;
import com.projeto.carrinhoPraiagp02.models.Produto;
import com.projeto.carrinhoPraiagp02.service.ProdutoService;
import com.projeto.carrinhoPraiagp02.service.UsuarioService;
import com.projeto.carrinhoPraiagp02.repository.ComandaRepo;

@SpringBootTest(properties={"app.security.enabled=true","app.bootstrap-admin.enabled=true","app.bootstrap-admin.password=test-only-bootstrap-password"})
@AutoConfigureMockMvc @Transactional class AuthHttpIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UsuarioService users;
    @Autowired ProdutoService products;
    @Autowired ComandaRepo comandas;
    record CsrfValue(Cookie cookie,String token){}
    private CsrfValue csrf() throws Exception {
        var result=mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
        return new CsrfValue(result.getResponse().getCookie("XSRF-TOKEN"),com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(),"$.token"));
    }
    private MockHttpServletRequestBuilder protectedRequest(MockHttpServletRequestBuilder request,CsrfValue csrf){return request.cookie(csrf.cookie()).header("X-XSRF-TOKEN",csrf.token());}
    private org.springframework.mock.web.MockHttpSession adminSession(CsrfValue csrf) throws Exception {
        var login=mvc.perform(protectedRequest(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@localhost\",\"senha\":\"test-only-bootstrap-password\"}"),csrf))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("ROLE_ADMIN")).andReturn();
        return (org.springframework.mock.web.MockHttpSession)login.getRequest().getSession(false);
    }

    @Test void loginCreatesSessionLogoutInvalidatesAndCsrfIsEnforced() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Autenticação necessária."));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}" )).andExpect(status().isForbidden());
        CsrfValue csrf=csrf();
        var session=adminSession(csrf);
        org.junit.jupiter.api.Assertions.assertNotNull(session);
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk());
        mvc.perform(get("/api/usuarios").session(session)).andExpect(status().isOk());
        mvc.perform(protectedRequest(post("/api/auth/logout").session(session),csrf)).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isUnauthorized());
    }

    @Test void staticFrontendAndItsAssetsArePublicWhenSecurityIsEnabled() throws Exception {
        mvc.perform(get("/")).andExpect(status().isOk());
        mvc.perform(get("/admin.html")).andExpect(status().isUnauthorized());
        mvc.perform(get("/admin"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/admin.html"));
        mvc.perform(get("/cardapio.html"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML));
        mvc.perform(get("/menu.js")).andExpect(status().isOk());
        mvc.perform(get("/api/produtos")).andExpect(status().isOk());

        String html = mvc.perform(get("/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andReturn().getResponse().getContentAsString();

        var assets = Pattern.compile("(?:href|src)=\"([^\"]+\\.(?:css|js)(?:\\?[^\"]*)?)\"")
                .matcher(html);
        int checkedAssets = 0;
        while (assets.find()) {
            String assetPath = assets.group(1).split("[?#]", 2)[0];
            if (assetPath.startsWith("./")) assetPath = assetPath.substring(1);
            if (!assetPath.startsWith("/")) assetPath = "/" + assetPath;
            mvc.perform(get(assetPath)).andExpect(status().isOk());
            checkedAssets++;
        }
        org.junit.jupiter.api.Assertions.assertTrue(checkedAssets >= 2,
                "A página inicial deve referenciar os bundles JavaScript e CSS.");
    }

    @Test void invalidRequestReturnsPortugueseValidationMessageWithoutChangingKeys() throws Exception {
        CsrfValue csrf = csrf();
        mvc.perform(protectedRequest(post("/api/categorias").contentType(MediaType.APPLICATION_JSON)
                .content("{}"), csrf))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Requisição inválida"))
                .andExpect(jsonPath("$.message").value("Verifique os dados informados."))
                .andExpect(jsonPath("$.details.nome").value("Este campo é obrigatório."));
    }

    @Test void employeeCanUseOperationsButNotAdminData() throws Exception {
        users.create("Employee","employee@example.test","TEST-EMP","employee-password","FUNCIONARIO");
        CsrfValue csrf=csrf();
        var login=mvc.perform(protectedRequest(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"employee@example.test\",\"senha\":\"employee-password\"}"),csrf)).andExpect(status().isOk()).andReturn();
        var session=(org.springframework.mock.web.MockHttpSession)login.getRequest().getSession(false);
        mvc.perform(get("/api/estoque/movimentacoes").session(session)).andExpect(status().isOk());
        mvc.perform(get("/api/usuarios").session(session)).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Você não tem permissão para acessar este recurso."));
        mvc.perform(get("/api/vendas").session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/api/relatorios/dashboard").session(session)).andExpect(status().isForbidden());
    }

    @Test void customerCanOpenUniqueComandaButCannotListOrInspectOthers() throws Exception {
        CsrfValue csrf=csrf();
        var opened=mvc.perform(protectedRequest(post("/api/comandas/cliente").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nomeCliente\":\"Walk-in\"}"),csrf)).andExpect(status().isCreated())
                .andExpect(jsonPath("$.numero").isNotEmpty()).andExpect(jsonPath("$.nomeCliente").value("Walk-in"))
                .andExpect(jsonPath("$.valorTotal").value(0)).andReturn();
        var second=mvc.perform(protectedRequest(post("/api/comandas/cliente").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nomeCliente\":\"Another walk-in\"}"),csrf)).andExpect(status().isCreated()).andReturn();
        String number=com.jayway.jsonpath.JsonPath.read(opened.getResponse().getContentAsString(),"$.numero");
        String nextNumber=com.jayway.jsonpath.JsonPath.read(second.getResponse().getContentAsString(),"$.numero");
        org.junit.jupiter.api.Assertions.assertNotEquals(number,nextNumber);
        mvc.perform(get("/api/comandas")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/comandas/"+number)).andExpect(status().isUnauthorized());
    }

    @Test void customerCanBuyFromPublicFlowWithoutStaffLogin() throws Exception {
        Produto product = new Produto();
        product.setNome("Água de coco");
        product.setDescricao("Gelada");
        product.setPreco(new java.math.BigDecimal("8.50"));
        product.setQuantidadeEstoque(3);
        product.setEstoqueMinimo(1);
        product.setCategoria("Bebidas");
        product.setDisponibilidade(true);
        product = products.save(product);

        CsrfValue csrf = csrf();
        var opened = mvc.perform(protectedRequest(post("/api/comandas/cliente").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nomeCliente\":\"Cliente do cardápio\"}"), csrf))
                .andExpect(status().isCreated()).andReturn();
        String comanda = com.jayway.jsonpath.JsonPath.read(opened.getResponse().getContentAsString(), "$.numero");

        var created = mvc.perform(protectedRequest(post("/api/carrinhos").contentType(MediaType.APPLICATION_JSON)
                .content("{\"comandaNumero\":\"" + comanda + "\"}"), csrf))
                .andExpect(status().isCreated()).andReturn();
        Long cartId = ((Number) com.jayway.jsonpath.JsonPath.read(created.getResponse().getContentAsString(), "$.id")).longValue();
        String cartToken = com.jayway.jsonpath.JsonPath.read(created.getResponse().getContentAsString(), "$.accessToken");

        mvc.perform(protectedRequest(post("/api/carrinhos/" + cartId + "/itens").contentType(MediaType.APPLICATION_JSON)
                .header("X-Cart-Token", cartToken)
                .content("{\"produtoId\":" + product.getId() + ",\"quantidade\":2}"), csrf))
                .andExpect(status().isOk());
        mvc.perform(protectedRequest(post("/api/carrinhos/" + cartId + "/checkout").contentType(MediaType.APPLICATION_JSON)
                .header("X-Cart-Token", cartToken).content("{\"formaPagamento\":\"PIX\"}"), csrf))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.valorTotal").value(17.0));

        org.junit.jupiter.api.Assertions.assertEquals(new java.math.BigDecimal("17.00"),
                comandas.findByNumero(comanda).orElseThrow().getValorTotal());

        org.junit.jupiter.api.Assertions.assertEquals(1, products.get(product.getId()).getQuantidadeEstoque());
    }

    @Test void cartTokenIsRequiredAndOnlyReturnedOnCreation() throws Exception {
        CsrfValue csrf=csrf();var admin=adminSession(csrf);
        mvc.perform(protectedRequest(post("/api/comandas").session(admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"numero\":\"SEC-100\",\"nomeCliente\":\"Customer\"}"),csrf)).andExpect(status().isCreated());
        var created=mvc.perform(protectedRequest(post("/api/carrinhos").contentType(MediaType.APPLICATION_JSON)
                .content("{\"comandaNumero\":\"SEC-100\"}"),csrf)).andExpect(status().isCreated()).andReturn();
        Long id=((Number)com.jayway.jsonpath.JsonPath.read(created.getResponse().getContentAsString(),"$.id")).longValue();
        String token=com.jayway.jsonpath.JsonPath.read(created.getResponse().getContentAsString(),"$.accessToken");
        mvc.perform(get("/api/carrinhos/"+id)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/carrinhos/"+id).header("X-Cart-Token","incorrect")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/carrinhos/"+id).header("X-Cart-Token",token)).andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").doesNotExist());
        mvc.perform(get("/api/carrinhos")).andExpect(status().isUnauthorized());
    }
}
