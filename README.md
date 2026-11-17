# Carrinho de Praia — Dinho's Canal 6

Sistema de cardápio e pedidos para o carrinho de praia Dinho's Canal 6.

## Estrutura

- `backend/`: API e aplicação Spring Boot, com persistência JPA e H2 para desenvolvimento.
- `web/public/`: interface em HTML, CSS e JavaScript sem framework ou etapa de compilação do frontend.

## Executar localmente

1. Gere os arquivos estáticos do Spring a partir das fontes do frontend:

   ```sh
   cd web
   npm run build:spring
   ```

2. Inicie o backend com Java 25:

   ```sh
   cd ../backend
   ./mvnw spring-boot:run
   ```

3. Acesse `http://localhost:8080/` para o cardápio público e `http://localhost:8080/admin` para o painel da equipe.

Compras reais usam os produtos e o estoque cadastrados no backend e são salvas como pedidos/vendas normais. Para apresentação, pedidos de teste ficam separados dos pedidos e faturamento reais; podem ser usados localmente ou persistidos no servidor com a configuração abaixo. O pagamento do checkout real é simulado.

## Persistência e deployment

Por padrão, o H2 persiste em `${user.home}/.dinhos/carrinho` (arquivo `carrinho.mv.db`), no diretório home do usuário que executa o backend. Configure `APP_DB_URL` para substituir a URL JDBC; `APP_DB_DRIVER`, `APP_DB_USERNAME` e `APP_DB_PASSWORD` permitem configurar driver e credenciais (os defaults são do H2). `APP_PUBLIC_BASE_URL` define a URL pública estável usada nos QR codes; vazio por padrão, a aplicação usa a origem da requisição.

Em deployment, monte armazenamento persistente nesse serviço e aponte `APP_DB_URL` para um caminho no volume montado. Defina também `APP_PUBLIC_BASE_URL` para a URL pública canônica, especialmente atrás de proxy. Essa alteração não recupera dados que já foram perdidos quando existiam apenas no H2 temporário em memória.

Antes de receber compras reais na nuvem, entre no painel com um usuário ADMIN e, na aba **Produtos**, clique em **Salvar na nuvem (Recomendado)**. Isso envia os produtos locais à API sem substituir o saldo de estoque dos produtos já associados. Para mover produtos de uma origem/domínio para outro, use **Exportar catálogo** no domínio antigo e **Importar catálogo** no novo; depois clique em **Salvar na nuvem (Recomendado)**. O arquivo contém somente produtos, não usuários nem pedidos.

## Compras de teste remotas

Compras de teste ficam em tabelas próprias e são exibidas nas abas de pedidos/comandas, inclusive em outros dispositivos. Configure `APP_TEST_ORDERS_ENABLED=true` no ambiente do servidor hospedado para permitir a criação durante a apresentação (o padrão é `false`); desligue a opção após a apresentação. O POST permanece protegido pelo CSRF padrão do Spring.

Para registrar uma compra de teste no servidor, abra o cardápio com `?teste=1` (por exemplo, `https://seu-dominio/cardapio.html?teste=1`). Sem esse parâmetro, compras com produtos da API usam o checkout real. Se não houver produtos na API, o cardápio usa o catálogo local para um teste que fica somente neste navegador.

- `POST /api/pedidos/testes` (público com CSRF): cria compra com `{ "nomeCliente": "...", "mesaNumero": 1, "itens": [{"produtoId": 1, "quantidade": 2}] }`.
- `GET /api/pedidos/testes` e `GET /api/comandas/testes` (ADMIN/FUNCIONARIO): consultam os registros remotos, inclusive quando a criação está desativada.
- `PATCH /api/pedidos/testes/{id}/status?status=EM_PREPARO|PRONTO|ENTREGUE` e `POST /api/pedidos/testes/{id}/cancelar` (ADMIN/FUNCIONARIO): avançam ou cancelam o pedido de teste sem alterar o estoque.

Os registros armazenam snapshot de nomes e preços e **não** criam `Pedido`, venda ou pagamento, não alteram estoque e não entram no faturamento/relatórios reais.
