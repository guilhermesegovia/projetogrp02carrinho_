package com.projeto.carrinhoPraiagp02;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.projeto.carrinhoPraiagp02.models.Categoria;
import com.projeto.carrinhoPraiagp02.models.Produto;
import com.projeto.carrinhoPraiagp02.repository.CategoriaRepo;
import com.projeto.carrinhoPraiagp02.repository.MovimentacaoRepo;
import com.projeto.carrinhoPraiagp02.repository.ProdutoRepo;
import com.projeto.carrinhoPraiagp02.service.CategoriaService;
import com.projeto.carrinhoPraiagp02.service.ProdutoService;

@SpringBootTest
@Transactional
class ProductCategoryValidationIntegrationTest {
    @Autowired ProdutoService products;
    @Autowired ProdutoRepo productRepo;
    @Autowired MovimentacaoRepo movements;
    @Autowired CategoriaService categories;
    @Autowired CategoriaRepo categoryRepo;

    @Test void productRequiresNonblankNamesAndPositivePriceAndKeepsStockNonnegative() {
        Produto blankNameAndPrice = product("  ", "Tools", "0", 2, 0);
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class, () -> products.save(blankNameAndPrice)).getStatusCode());
        Produto blankCategory = product("Valid", " ", "1", 2, 0);
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class, () -> products.save(blankCategory)).getStatusCode());
        Produto negativeStock = product("Valid", "Tools", "1", -1, 0);
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class, () -> products.save(negativeStock)).getStatusCode());
        assertTrue(movements.findAll().isEmpty());
    }

    @Test void productDeleteDisablesWithoutChangingStockOrRecordingMovement() {
        Produto saved = products.save(product("Historic", "Tools", "2", 7, 1));
        long movementCount = movements.count();
        products.delete(saved.getId());
        Produto after = productRepo.findById(saved.getId()).orElseThrow();
        assertFalse(after.getDisponibilidade());
        assertEquals(7, after.getQuantidadeEstoque());
        assertEquals(movementCount, movements.count());
    }

    @Test void categoryNamesAreUniqueIgnoringCaseAndWhitespaceOnCreateAndUpdate() {
        Categoria first = category("Garden   Tools");
        categories.criarCategoria(first);
        assertEquals("Garden Tools", first.getNome());
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> categories.criarCategoria(category(" garden tools "))).getStatusCode());
        Categoria second = categories.criarCategoria(category("Kitchen"));
        Categoria patch = category(" GARDEN  TOOLS ");
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> categories.atualizarCategoria(second.getId(), patch)).getStatusCode());
        categories.atualizarCategoria(first.getId(), category("  GARDEN   TOOLS "));
        assertEquals("GARDEN TOOLS", categoryRepo.findById(first.getId()).orElseThrow().getNome());
    }

    private Produto product(String name, String category, String price, int stock, int minimum) {
        Produto product = new Produto();
        product.setNome(name); product.setDescricao(""); product.setCategoria(category);
        product.setPreco(new BigDecimal(price)); product.setQuantidadeEstoque(stock);
        product.setEstoqueMinimo(minimum); product.setDisponibilidade(true);
        return product;
    }

    private Categoria category(String name) {
        Categoria category = new Categoria();
        category.setNome(name); category.setDocumento(java.util.UUID.randomUUID().toString());
        return category;
    }
}
