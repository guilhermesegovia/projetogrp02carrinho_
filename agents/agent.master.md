# AGENT.md — Projeto INT GRP02 Carrinho

## Projeto
Sistema web de gestão para um quiosque de praia, desenvolvido em:
* **Linguagem / Framework:** Java, Spring Boot
* **Persistência / BD:** Spring Data JPA / Hibernate, Banco de dados relacional
* **Segurança / API:** Spring Security, REST API
* **Objetivo:** Centralizar cardápio, carrinho, comandas, pedidos, pagamentos, estoque e vendas.
* *Nota:* Não utilizar mesas.

---

## Requisitos
| Código | Requisito |
| :--- | :--- |
| **RF01** | Login |
| **RF02** | Controle de permissões |
| **RF04** | Cardápio |
| **RF06** | Adicionar produtos ao carrinho |
| **RF07** | Gerenciar carrinho |
| **RF09** | Criar comanda |
| **RF10** | Pagamento |
| **RF12** | Criar pedido |
| **RF14** | Acompanhar pedido |
| **RF16** | Consultar comandas |
| **RF19** | Cadastrar produtos |
| **RF21** | Controle de estoque |
| **RF24** | Baixa automática do estoque |
| **RF26** | Alerta de estoque baixo |
| **RF28** | Registro de vendas |
| **RF30** | Dashboard |
| **RF31** | Relatórios de vendas |

---

## Fluxo Principal
1. Cardápio $\rightarrow$ Carrinho
2. Identificação por Comanda
3. Pagamento
4. Finalização (Validação de estoque $\rightarrow$ Registrar pagamento $\rightarrow$ Criar pedido $\rightarrow$ Baixar estoque $\rightarrow$ Registrar movimentação $\rightarrow$ Registrar venda $\rightarrow$ Finalizar carrinho)
5. Acompanhamento do Pedido

---

## Ambientes e Permissões

### Cliente (Acesso público)
* Cardápio, Carrinho, Identificação por nome e comanda, Pagamento, Confirmação, Acompanhamento do pedido.

### Administrativo (Protegido por Spring Security)
* Dashboard, Pedidos, Comandas, Produtos, Estoque, Vendas, Funcionários, Relatórios.

### Perfis (Backend)
* `ADMIN`: Acesso completo ao ambiente administrativo.
* `FUNCIONARIO`: Acesso a atendimento, pedidos, comandas e operações permitidas de estoque.

---

## Arquitetura
Estrutura do projeto: `controller/`, `service/`, `repository/`, `model/`, `dto/`, `exception/`, `config/`, `security/`.

* **Controller:** Apenas HTTP e entrada/saída. Não colocar regras de negócio.
* **Service:** Regras de negócio e transações.
* **Repository:** Persistência de dados.
* **Model:** Entidades JPA.
* **DTO:** Entrada e saída da API.
* **Security:** Autenticação e autorização.

---

## Entidades
* **Usuario:** `id`, `nome`, `email`, `senha`, `cargo`
* **Comanda:** `id`, `numero`, `nomeCliente`, `status`, `dataAbertura`, `dataFechamento`, `valorTotal`
* **Carrinho:** `id`, `comanda`, `valorTotal`
* **ItemCarrinho:** `id`, `carrinho`, `produto`, `quantidade`, `precoUnitario`
* **Pedido:** `id`, `comanda`, `usuario`, `data`, `status`, `valorTotal`
  * *Status:* `PENDENTE`, `EM_PREPARO`, `PRONTO`, `ENTREGUE`, `CANCELADO`
* **ItemPedido:** `id`, `pedido`, `produto`, `quantidade`, `precoUnitario`
* **Produto:** `id`, `nome`, `descricao`, `preco`, `quantidadeEstoque`, `estoqueMinimo`, `categoria`, `disponibilidade`
* **Categoria:** `id`, `nome`
* **MovimentacaoEstoque:** `id`, `produto`, `tipo`, `quantidade`, `data`, `usuario`
  * *Tipos:* `ENTRADA`, `SAIDA`
* **Venda:** `id`, `comanda`, `usuario`, `valorTotal`, `formaPagamento`, `data`
* **Pagamento:** `id`, `venda`, `formaPagamento`, `valor`, `status`, `data`
  * *Formas:* `PIX`, `CARTAO`, `DINHEIRO`
  * *Status:* `PENDENTE`, `APROVADO`, `CANCELADO`

---

## Regras Críticas de Negócio

### Autenticação e Segurança
* Senhas codificadas estritamente com **BCrypt**. Nunca em texto puro.
* Validações de permissão aplicadas obrigatoriamente no backend.

### Valores e Datas
* **Valores monetários:** Utilizar estritamente `BigDecimal` (nunca `double` ou `float`).
* **Datas/Horas:** Preferir `LocalDate`, `LocalDateTime` e `LocalTime`.

### Comanda
* Campo `numero` deve ser **único**.
* `nomeCliente` pertence à `Comanda`.
* Uma comanda pode ter vários pedidos.
* **Proibido utilizar o conceito de mesas.**

### Carrinho e Pedido
* Item do carrinho/pedido com `quantidade` $\ge 1$.
* Subtotal e total calculados automaticamente.
* `ItemPedido` e `ItemCarrinho` devem armazenar o `precoUnitario` do momento do pedido.
* O `Pedido` deve ter identificador único e conter itens.
* Pedido com status `CANCELADO` não é considerado venda concluída.
* Evitar e proteger contra duplicidade de pedidos, pagamentos, vendas e baixas.

### Estoque e Movimentação
* Nunca permitir estoque ou preço negativos.
* Não permitir adição/compra de produto indisponível ou sem estoque suficiente.
* Baixa automática realizada no momento da confirmação da compra.
* Toda alteração de estoque deve gerar um registro em `MovimentacaoEstoque`.
* Emitir alerta quando `quantidadeEstoque` $<$ `estoqueMinimo`.
* Operações críticas do estoque devem ser transacionais (`@Transactional`).

### Pagamento
* Não implementar integração real de gateways nesta versão (simulação de aprovação/status).

---

## API & Endpoints
Rotas organizadas por recurso sob o prefixo `/api/`:
* `/api/auth`
* `/api/produtos`
* `/api/categorias`
* `/api/carrinhos`
* `/api/comandas`
* `/api/pedidos`
* `/api/pagamentos`
* `/api/vendas`
* `/api/estoque`
* `/api/usuarios`
* `/api/relatorios`

* **Tratamento de Erros:** Utilizar `@RestControllerAdvice` global. Nunca expor *stack traces*, senhas ou informações internas de infraestrutura.
* **Validação:** Utilizar Bean Validation no backend (`@NotBlank`, `@NotNull`, `@Email`, `@Positive`, `@PositiveOrZero`, `@Size`).
* **Protocolo:** Utilizar métodos HTTP, códigos de status e respostas estruturadas adequadamente.

---

## Dashboard e Relatórios (Com dados reais do banco)
* **Dashboard:** Vendas do dia, faturamento, pedidos, comandas abertas, pedidos em andamento, alerta de estoque baixo.
* **Relatórios:** Vendas, faturamento, estoque, produtos mais vendidos, formas de pagamento.

---

## Ordem de Implementação
1. Banco / JPA / Entidades
2. Produtos / Categorias
3. Carrinho
4. Comandas
5. Pedidos
6. Pagamentos
7. Estoque
8. Vendas
9. Login / Segurança
10. Dashboard
11. Funcionários
12. Relatórios
13. Testes *(Foco: Carrinho, Pedidos, Estoque/Insuficiência, Pagamento, Vendas, Permissões e Cancelamentos)*

---

## Diretrizes do Agente
* Priorizar: **Requisitos $\rightarrow$ Regras de negócio $\rightarrow$ Integridade dos dados $\rightarrow$ Segurança $\rightarrow$ Organização $\rightarrow$ Testes $\rightarrow$ Simplicidade**.
* Analisar o código existente antes de implementar. Reutilizar estruturas e não alterar arquivos desnecessariamente.
* Não adicionar bibliotecas, tecnologias ou complexidades não solicitadas (*overengineering*).
* Critério de Pronto: Código compilando, integrado, validado no backend, seguro, sem quebrar funcionalidades existentes e testado.   P