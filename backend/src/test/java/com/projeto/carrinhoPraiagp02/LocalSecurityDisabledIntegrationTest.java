package com.projeto.carrinhoPraiagp02;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {"spring.profiles.active=dev", "app.security.enabled=false"})
@AutoConfigureMockMvc
class LocalSecurityDisabledIntegrationTest {
    @Autowired MockMvc mvc;

    @Test void protectedEndpointIsAvailableWithoutLoginOrCsrfWhenSecurityDisabled() throws Exception {
        mvc.perform(get("/api/usuarios")).andExpect(status().isOk());
    }

    @Test void csrfEndpointReturnsEmptyTokenWhenSecurityIsDisabled() throws Exception {
        mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andExpect(jsonPath("$.token").value(""));
    }
}
