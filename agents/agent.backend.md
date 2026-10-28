# AGENT.md — Configuração Backend (Java 25 & Spring Boot 4.1.1)

## Projeto
Guia de configuração e diretrizes técnicas para o backend do sistema web de gestão para quiosque de praia.

---

## Stack Tecnológica
* **Linguagem:** Java 25
* **Gerenciador de Dependências / Build:** Maven
* **Framework:** Spring Boot 4.1.1
* **Banco de Dados (Desenvolvimento/Testes):** H2 Database (In-Memory)
* **Persistência:** Spring Data JPA / Hibernate
* **Acessores:** getters e setters explícitos nas entidades, sem Lombok

---

## Dependências Principais (`pom.xml`)
As dependências essenciais configuradas para este ambiente são:
* `spring-boot-starter-web` (REST APIs e suporte HTTP)
* `spring-boot-starter-data-jpa` (Persistência e Spring Data)
* `com.h2database:h2` (Banco de dados H2)
* `spring-boot-devtools` (Hot reload e facilidade de desenvolvimento)

---

## Estrutura de Arquitetura e Pacotes
O projeto segue estritamente a divisão em camadas:

```text
src/
└── main/
    ├── java/
    │   └── com/
    │       └── seuprojeto/
    │           ├── controller/  # Controladores REST (apenas entrada/saída HTTP)
    │           ├── service/     # Regras de negócio e transações (@Transactional)
    │           ├── repository/  # Interfaces de persistência (Spring Data JPA)
    │           ├── model/       # Entidades JPA (@Entity)
    │           ├── dto/         # Objetos de Transferência de Dados
    │           ├── exception/   # Tratamento global de erros (@RestControllerAdvice)
    │           ├── config/      # Configurações gerais do Spring
    │           └── security/    # Configurações do Spring Security e JWT/Auth
    └── resources/
        ├── application.yml      # Configurações de conexões e banco H2
        └── data.sql             # (Opcional) Carga inicial de dados para testes
