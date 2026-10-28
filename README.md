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

O checkout da API usa os produtos e o estoque cadastrados no backend. Quando a API não tem catálogo, o cardápio local permite apenas compras de demonstração; esses pedidos ficam no navegador e não são enviados ao servidor. O pagamento é simulado.
