# 🛍️ DSeAPIs Elinton Store - API de Serviços

> Sistema de Controle de Estoque para Loja de Roupas com transações ACID

[![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MariaDB](https://img.shields.io/badge/MariaDB-003545?logo=mariadb&logoColor=white)](https://mariadb.org/)
[![Zod](https://img.shields.io/badge/Zod-Validação-3068B7)](https://zod.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

API REST construída como **Trabalho #1** da disciplina **Desenvolvimento de Serviços e APIs** do curso de Análise e Desenvolvimento de Sistemas (UniSenac Pelotas), demonstrando o uso de transações relacionais para garantir consistência de dados em um cenário de e-commerce simplificado.

---

## 📑 Sumário

- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Modelo de Dados](#-modelo-de-dados)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Execução](#-instalação-e-execução)
- [Endpoints da API](#-endpoints-da-api)
- [Transações ACID](#-transações-acid)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Evidências de Teste](#-evidências-de-teste)
- [Fluxo de Versionamento](#-fluxo-de-versionamento)
- [Contexto Acadêmico](#-contexto-acadêmico)
- [Autor](#-autor)

---

## ✨ Funcionalidades
sc.vistoriasleto** de Produtos e Clientes com validação de entrada
- ✅ **Registro de Venda** com transação atômica que:
  - Cria a venda e seus itens
  - Decrementa o estoque dos produtos vendidos
  - Atualiza o histórico de gastos do cliente
  - Calcula o total da nota fiscal
- ✅ **Devolução de Venda** como transação reversa (estoque e gastos são restaurados)
- ✅ **Validação de regras de negócio** antes da transação (fail-fast)
- ✅ **Envio de e-mail** com o histórico de compras do cliente via Nodemailer + Mailtrap
- ✅ **Validação de dados de entrada** com Zod e mensagens de erro claras
- ✅ **Status HTTP semânticos** (200, 201, 400, 404, 409, 500)

---

## 🔧 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20+ |
| Linguagem | TypeScript 5 (modo strict) |
| Framework HTTP | Express 5 |
| ORM | Prisma 7 com adapter MariaDB |
| Banco de Dados | MariaDB / MySQL |
| Validação | Zod 4 |
| E-mail | Nodemailer + Mailtrap (sandbox) |
| Hot Reload | tsx watch |
| Cliente HTTP | Bruno (testes manuais) |

---

## 🗂️ Modelo de Dados

O sistema possui **4 entidades relacionadas**, modeladas para representar o fluxo natural de uma loja:

```mermaid
erDiagram
    CLIENTE ||--o{ VENDA : "faz"
    VENDA ||--|{ ITEM_VENDA : "contém"
    PRODUTO ||--o{ ITEM_VENDA : "está em"

    CLIENTE {
        int id PK
        string nome
        string cpf UK
        string email
        decimal gastos
    }
    PRODUTO {
        int id PK
        string nome
        int qtd
        decimal preco
        string marca
        enum categoria
    }
    VENDA {
        int id PK
        int clienteId FK
        datetime data
        decimal totalNF
    }
    ITEM_VENDA {
        int id PK
        int vendaId FK
        int produtoId FK
        int qtd
        decimal preco
    }
```

**Decisões de design importantes:**

- **`ItemVenda` como tabela associativa** — resolve o relacionamento N:N entre Venda e Produto
- **`enum Categoria`** — garante consistência (valores: `Camisa`, `Calca`, `Vestido`, `Calcado`, `Acessorio`)
- **`@unique` no CPF** — evita clientes duplicados (retorna `409 Conflict`)
- **`Decimal(9,2)` nos preços** — evita erros de arredondamento típicos de Float
- **`@default(0)` em `gastos` e `totalNF`** — clientes e vendas iniciam zerados
- **Preço guardado no `ItemVenda`** — preserva o histórico mesmo se o preço do produto mudar depois

---

## 📋 Pré-requisitos

- **Node.js** 20 ou superior
- **MariaDB** ou **MySQL** 8+ rodando localmente
- **Bruno** (recomendado para testar as rotas) — [usebruno.com](https://www.usebruno.com/)
- Conta **Mailtrap** gratuita — [mailtrap.io](https://mailtrap.io/) — apenas para o entregável de e-mail

---

## 🚀 Instalação e Execução

### 1. Clone o repositório

```bash
git clone https://github.com/Elinton-Souza/DSeAPIS_elinton_store.git
cd DSeAPIS_elinton_store/elinton_store
```

### 2. Crie o banco no MariaDB

```sql
CREATE DATABASE elinton_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/elinton_store"
DATABASE_USER="root"
DATABASE_PASSWORD="SUA_SENHA"
DATABASE_NAME="elinton_store"
DATABASE_HOST="localhost"
DATABASE_PORT=3306

MAILTRAP_EMAIL="seu_user_mailtrap"
MAILTRAP_SENHA="sua_senha_mailtrap"
```

### 4. Instale as dependências

```bash
npm install
```

### 5. Execute a migration e gere o Prisma Client

```bash
npx prisma migrate dev --name criacao_tabelas
npx prisma generate
```

### 6. Suba o servidor

```bash
npm run dev
```

O servidor sobe em **http://localhost:3000** e o terminal mostra cada query SQL em tempo real (graças ao `log: ["query", "info", "warn", "error"]` na configuração do Prisma).

---

## 📡 Endpoints da API

### Produtos `/produtos`

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `GET` | `/produtos` | Lista todos, ordenados por nome | 200 / 500 |
| `GET` | `/produtos/:id` | Busca por ID | 200 / 404 / 500 |
| `POST` | `/produtos` | Cria com validação Zod | 201 / 400 / 500 |
| `PUT` | `/produtos/:id` | Atualiza | 200 / 400 / 500 |
| `DELETE` | `/produtos/:id` | Exclui | 200 / 500 |

**Body de criação:**
```json
{
  "nome": "Camisa Polo Azul",
  "qtd": 10,
  "preco": 89.90,
  "marca": "Lacoste",
  "categoria": "Camisa"
}
```

### Clientes `/clientes`

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `GET` | `/clientes` | Lista todos | 200 / 500 |
| `GET` | `/clientes/:id` | Busca por ID (inclui vendas) | 200 / 404 / 500 |
| `POST` | `/clientes` | Cria — 409 se CPF duplicado | 201 / 400 / 409 / 500 |
| `PUT` | `/clientes/:id` | Atualiza | 200 / 400 / 500 |
| `DELETE` | `/clientes/:id` | Exclui | 200 / 500 |

**Body de criação:**
```json
{
  "nome": "Maria Silva",
  "cpf": "111.222.333-44",
  "email": "maria@email.com"
}
```

### Vendas `/vendas` ⭐ (com transação)

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `GET` | `/vendas` | Lista todas com cliente + itens + produto aninhados | 200 / 500 |
| `GET` | `/vendas/:id` | Busca uma com tudo aninhado | 200 / 404 / 500 |
| `POST` | `/vendas` | Registra venda em **transação** | 201 / 400 / 404 / 500 |
| `DELETE` | `/vendas/:id` | Devolução em **transação reversa** | 200 / 404 / 500 |

**Body de criação:**
```json
{
  "clienteId": 1,
  "itens": [
    { "produtoId": 1, "qtd": 2 },
    { "produtoId": 3, "qtd": 1 }
  ]
}
```

### E-mail `/email`

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `POST` | `/email/cliente/:id` | Envia histórico de compras por e-mail | 200 / 404 / 500 |

---

## 🔒 Transações ACID

O coração do projeto está nas rotas de venda e devolução, que utilizam o **modo callback** do `prisma.$transaction` para garantir atomicidade em operações multi-tabela:

```ts
await prisma.$transaction(async (tx) => {
  // 1. Cria a Venda
  const novaVenda = await tx.venda.create({ data: { clienteId, totalNF } })

  // 2. Para cada item: cria ItemVenda + decrementa estoque
  for (const item of itens) {
    await tx.itemVenda.create({ data: { vendaId: novaVenda.id, ... } })
    await tx.produto.update({
      where: { id: item.produtoId },
      data: { qtd: { decrement: item.qtd } }
    })
  }

  // 3. Incrementa gastos do cliente
  await tx.cliente.update({
    where: { id: clienteId },
    data: { gastos: { increment: totalNF } }
  })
})
```

### Princípios aplicados

- **Atomicidade** — se qualquer operação falhar, o Prisma faz `ROLLBACK` automático no MariaDB
- **Validação ANTES da transação** — cliente, produtos e estoque são checados antes de abrir transação (fail-fast)
- **Modo callback obrigatório** — porque o ID da Venda recém-criada é necessário para criar os ItensVenda
- **Devolução simétrica** — `DELETE /vendas/:id` faz exatamente o inverso (restaura estoque, decrementa gastos, deleta itens e venda)

---

## 📁 Estrutura do Projeto

```
DSeAPIS_elinton_store/
├── docs/
│   └── evidencias/                  # prints de testes no Bruno por entregável
│       ├── 02-crud-basico/
│       ├── 03-venda-transacao/
│       ├── 04-devolucao-transacao/
│       └── 05-envio-email/
├── elinton_store/                   # aplicação Node
│   ├── .env.example
│   ├── .gitignore
│   ├── lib/
│   │   └── prisma.ts                # conexão única do Prisma Client
│   ├── prisma/
│   │   ├── schema.prisma            # modelo de dados
│   │   └── migrations/              # migrations versionadas
│   ├── src/
│   │   ├── server.ts                # bootstrap do Express
│   │   └── routes/
│   │       ├── produtos.ts          # CRUD Produtos
│   │       ├── clientes.ts          # CRUD Clientes
│   │       ├── vendas.ts            # Venda + Devolução (transações)
│   │       └── email.ts             # Envio de e-mail
│   ├── package.json
│   ├── prisma.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 📸 Evidências de Teste

Cada entregável tem prints organizados em `docs/evidencias/` mostrando:

- **Bruno** com request e response (status HTTP visível)
- **Terminal** com as queries SQL do Prisma em tempo real
- **Mailtrap** com os e-mails recebidos (entregável 5)

Exemplos do que está documentado:

- Criação de produto com `201 Created` + SQL `INSERT`
- Listagem ordenada
- Validação Zod retornando `400` com erros estruturados
- Tentativa de CPF duplicado retornando `409 Conflict`
- Venda com transação completa (`BEGIN` → `INSERTs` → `UPDATEs` → `COMMIT`)
- Estoque insuficiente retornando `400` antes de abrir transação
- Devolução restaurando o estado anterior
- E-mail chegando no Mailtrap com o histórico HTML do cliente

---

## 🌳 Fluxo de Versionamento

Desenvolvido seguindo padrão **Git Flow simplificado**:

```
main                          ← release oficial (apresentado)
 └── dev                      ← integração das features
      ├── feat/setup-inicial          (passos 4-12)
      ├── feat/crud-basico            (entregável 2)
      ├── feat/venda-transacao        (entregável 3)
      ├── feat/devolucao-transacao    (entregável 4)
      └── feat/envio-mail             (entregável 5)
```

Cada feature foi entregue via **Pull Request** com commits granulares usando convenção `gitmoji`.

---

## 🎓 Contexto Acadêmico

- **Disciplina:** Desenvolvimento de Serviços e APIs
- **Curso:** CST em Análise e Desenvolvimento de Sistemas
- **Instituição:** Centro Universitário UniSenac - Campus Pelotas
- **Professor:** Edécio Fernando Iepsen
- **Trabalho #1:** APIs com tabelas relacionadas e transações
- **Data de entrega:** 29/05/2026

### Atividades cumpridas (Conceito A)

| # | Atividade | Status |
|---|---|---|
| 1 | Proposta entregue | ✅ |
| 2 | Banco + schema + migration | ✅ |
| 3 | CRUD de Produtos e Clientes | ✅ |
| 4 | Venda com transação | ✅ |
| 5 | Devolução com transação reversa | ✅ |
| 6 | Envio de e-mail com histórico | ✅ |

---

## 👤 Autor

**Elinton Souza Cunha**

- GitHub: [@Elinton-Souza](https://github.com/Elinton-Souza)
- E-mail: esc.vistorias@gmail.com

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos. Sinta-se à vontade para usá-lo como referência de estudo.

---

<p align="center">
  <i>Construído com ☕ e muita atenção a transações ACID.</i>
</p>
