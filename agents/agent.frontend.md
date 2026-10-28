# AGENT.md — Frontend (HTML5, CSS3, JavaScript Vanilla integrados no Spring Boot)

## Projeto
Guia de diretrizes e estrutura para o desenvolvimento do frontend do sistema web de gestão para quiosque de praia, servido diretamente pelo Spring Boot (sem frameworks SPA externos como React/Angular, mantendo a simplicidade).

---

## Stack Tecnológica do Frontend
* **Marcação:** HTML5
* **Estilização:** CSS3 (Vanilla / Variáveis CSS / Flexbox / Grid)
* **Lógica / Requisições:** JavaScript Vanilla (ES6+) com `fetch API`
* **Servidor de Arquivos Estáticos:** Spring Boot (`src/main/resources/static/`)

---

## Estrutura de Pastas e Arquivos (`src/main/resources/static/`)
Para manter o projeto organizado e modular, a estrutura estática deve seguir o modelo abaixo:

```text
src/
└── main/
    ├── resources/
    │   ├── static/
    │   │   ├── css/
    │   │   │   ├── global.css        # Reset, variáveis de cores, fontes e layout base
    │   │   │   ├── cardapio.css      # Estilos específicos da tela de cardápio/carrinho
    │   │   │   └── admin.css         # Estilos específicos do painel administrativo
    │   │   ├── js/
    │   │   │   ├── api.js            # Funções utilitárias centralizadas para chamadas fetch à API
    │   │   │   ├── cardapio.js       # Lógica do cardápio e manipulação do carrinho
    │   │   │   ├── comanda.js        # Lógica de identificação e gestão de comanda pelo cliente
    │   │   │   └── admin.js          # Lógica do dashboard, listagens e tabelas administrativas
    │   │   ├── index.html            # Página inicial / Entrada do cardápio (Cliente)
    │   │   ├── carrinho.html         # Página de revisão do carrinho e pagamento
    │   │   ├── acompanhamento.html   # Tela de acompanhamento de status do pedido
    │   │   └── admin.html            # Painel Administrativo protegido
    │   └── application.yml