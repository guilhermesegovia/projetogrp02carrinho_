package com.projeto.carrinhoPraiagp02;

import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import com.projeto.carrinhoPraiagp02.models.Produto;
import com.projeto.carrinhoPraiagp02.repository.*;
import com.projeto.carrinhoPraiagp02.service.*;

@SpringBootTest @Transactional class InventoryAndReportIntegrationTest {
    @Autowired MovimentacaoService stock;
    @Autowired ProdutoRepo products;
    @Autowired MovimentacaoRepo movements;
    @Autowired ReportService reports;
    @Autowired ProdutoService productService;

    @Test void inventoryEntryExitAndAdjustmentAreRecordedWithActor() {
        Produto p=new Produto();p.setNome("Test product");p.setDescricao("");p.setPreco(new BigDecimal("2.00"));p.setQuantidadeEstoque(4);p.setEstoqueMinimo(3);p.setCategoria("Test");p.setDisponibilidade(true);products.save(p);
        stock.change(p.getId(),"SAIDA",2,"employee@test");
        assertEquals(2,products.findById(p.getId()).orElseThrow().getQuantidadeEstoque());
        assertEquals("employee@test",movements.findAll().get(0).getUsuario());
        stock.change(p.getId(),"AJUSTE",5,"admin@test");
        assertEquals(5,products.findById(p.getId()).orElseThrow().getQuantidadeEstoque());
        assertEquals(2,movements.count());
        assertTrue(reports.dashboard().containsKey("estoqueBaixo"));
        assertThrows(RuntimeException.class,()->stock.change(p.getId(),"SAIDA",6,"employee@test"));
    }

    @Test void productDeleteSoftDisablesInsteadOfRemovingHistory(){
        Produto p=new Produto();p.setNome("Historic product");p.setDescricao("");p.setPreco(new BigDecimal("2.00"));p.setQuantidadeEstoque(0);p.setEstoqueMinimo(0);p.setCategoria("Test");p.setDisponibilidade(true);p=products.save(p);Long id=p.getId();
        productService.delete(id);
        assertTrue(products.findById(id).isPresent());
        assertFalse(products.findById(id).orElseThrow().getDisponibilidade());
    }
}
