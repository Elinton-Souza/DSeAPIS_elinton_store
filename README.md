# 🛍️ DSeAPIs Elinton Store - API de Serviços

> Sistema de Controle de Estoque para Loja de Roupas com transações ACID e recursos de segurança

[![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MariaDB](https://img.shields.io/badge/MariaDB-003545?logo=mariadb&logoColor=white)](https://mariadb.org/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![bcrypt](https://img.shields.io/badge/bcrypt-Hash-red)](https://www.npmjs.com/package/bcrypt)
[![Zod](https://img.shields.io/badge/Zod-Validação-3068B7)](https://zod.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

API REST construída em duas fases como trabalhos da disciplina **Desenvolvimento de Serviços e APIs** do curso de Análise e Desenvolvimento de Sistemas (UniSenac Pelotas):

- **Trabalho #1** — APIs com tabelas relacionadas e transações
- **Trabalho #2** — Adicionar recursos de segurança em APIs

---

## 📑 Sumário

- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Modelo de Dados](#-modelo-de-dados)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Execução](#-instalação-e-execução)
- [Endpoints da API](#-endpoints-da-api)
- [Transações ACID](#-transações-acid)
- [Segurança](#-segurança)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Evidências de Teste](#-evidências-de-teste)
- [Fluxo de Versionamento](#-fluxo-de-versionamento)
- [Contexto Acadêmico](#-contexto-acadêmico)
- [Autor](#-autor)

---

## ✨ Funcionalidades

### Trabalho #1 — Estoque e Transações
- ✅ **CRUD completo** de Produtos e Clientes com validação de entrada
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

### Trabalho #2 — Segurança
- 🔐 **Cadastro de usuários** com senha criptografada por bcrypt (10 rounds)
- 🔐 **Validação de senha forte** via Zod (mín. 8 caracteres, maiúscula, minúscula, número, símbolo)
- 🔐 **Impedimento de e-mail duplicado** com resposta 409 Conflict
- 🔐 **Login com JWT** (validade de 1h) e mensagem personalizada de boas-vindas
- 🔐 **Middleware de autenticação** aplicado em rotas críticas (POST/vendas, DELETE/vendas, DELETE/produtos)
- 🔐 **Recuperação de senha** em duas etapas com código de 4 caracteres enviado por e-mail
- 🔐 **Sistema de logs de auditoria** registrando LOGIN, TENTATIVA_LOGIN_INVALIDA e SENHA_ALTERADA
- 🔐 **Rotas de consulta de logs** (todos e por usuário) protegidas por token
- 🔐 **Limite de 3 tentativas de login** → bloqueio automático do usuário
- 🔐 **Registro de data/hora do último acesso** exibido no login
- 🔐 **Soft Delete** em Clientes (preserva histórico e permite restauração)

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
| Criptografia de Senhas | bcrypt |
| Autenticação | jsonwebtoken (JWT) |
| E-mail | Nodemailer + Mailtrap (sandbox) |
| Hot Reload | tsx watch |
| Cliente HTTP | Bruno (testes manuais) |

---

## 🗂️ Modelo de Dados

O sistema possui **6 entidades relacionadas** modeladas para representar o fluxo natural de uma loja com controle de acesso e auditoria:

```mermaid
erDiagram
    USUARIO ||--o{ LOG : "gera"
    CLIENTE ||--o{ VENDA : "faz"
    VENDA ||--|{ ITEM_VENDA : "contém"
    PRODUTO ||--o{ ITEM_VENDA : "está em"

    USUARIO {
        int id PK
        string nome
        string email UK
        string senha
        datetime ultimoLogin
        int tentativasInvalidas
        bool bloqueado
        string codigoRecuperacao
    }
    LOG {
        int id PK
        string descricao
        string complemento
        datetime createdAt
        int usuarioId FK
    }
    CLIENTE {
        int id PK
        string nome
        string cpf UK
        string email
        decimal gastos
        bool deleted
        datetime deletedAt
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

### Decisões de design importantes

- **`ItemVenda` como tabela associativa** — resolve o relacionamento N:N entre Venda e Produto
- **`enum Categoria`** — garante consistência (valores: `Camisa`, `Calca`, `Vestido`, `Calcado`, `Acessorio`)
- **`@unique` em CPF e email** — evita duplicatas
- **`Decimal(9,2)` nos preços** — evita erros de arredondamento típicos de Float
- **`@default(0)` em `gastos` e `totalNF`** — clientes e vendas iniciam zerados
- **Preço guardado no `ItemVenda`** — preserva histórico se o preço do produto mudar
- **Senha como `VarChar(200)`** — comporta o hash bcrypt (~60 caracteres)
- **`codigoRecuperacao` no próprio Usuario** — evita tabela auxiliar para o fluxo de recuperação de senha
- **Soft Delete em Cliente** — `deleted` e `deletedAt` preservam o histórico de vendas do cliente removido

---

## 📋 Pré-requisitos

- **Node.js** 20 ou superior
- **MariaDB** ou **MySQL** 8+ rodando localmente
- **Bruno** (recomendado para testar as rotas) — [usebruno.com](https://www.usebruno.com/)
- Conta **Mailtrap** gratuita — [mailtrap.io](https://mailtrap.io/) — para os fluxos de e-mail

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

JWT_SECRET="uma_chave_secreta_longa_e_aleatoria"
```

### 4. Instale as dependências

```bash
npm install
```

### 5. Execute a migration e gere o Prisma Client

```bash
npx prisma migrate deploy
npx prisma generate
```

### 6. Suba o servidor

```bash
npm run dev
```

O servidor sobe em **http://localhost:3000** e o terminal mostra cada query SQL em tempo real.

---

## 📡 Endpoints da API

### Produtos `/produtos`

| Método | Rota | Descrição | Auth | Códigos |
|---|---|---|:-:|---|
| `GET` | `/produtos` | Lista todos, ordenados por nome | — | 200 / 500 |
| `GET` | `/produtos/:id` | Busca por ID | — | 200 / 404 / 500 |
| `POST` | `/produtos` | Cria com validação Zod | — | 201 / 400 / 500 |
| `PUT` | `/produtos/:id` | Atualiza | — | 200 / 400 / 500 |
| `DELETE` | `/produtos/:id` | Exclui | 🔒 | 200 / 401 / 500 |

### Clientes `/clientes`

| Método | Rota | Descrição | Auth | Códigos |
|---|---|---|:-:|---|
| `GET` | `/clientes` | Lista ativos (soft delete filtrado) | — | 200 / 500 |
| `GET` | `/clientes/:id` | Busca por ID ativo (inclui vendas) | — | 200 / 404 / 500 |
| `POST` | `/clientes` | Cria — 409 se CPF duplicado | — | 201 / 400 / 409 / 500 |
| `PUT` | `/clientes/:id` | Atualiza | — | 200 / 400 / 500 |
| `DELETE` | `/clientes/:id` | Soft Delete (marca `deleted=true`) | — | 200 / 404 / 500 |

### Vendas `/vendas` ⭐ (com transação)

| Método | Rota | Descrição | Auth | Códigos |
|---|---|---|:-:|---|
| `GET` | `/vendas` | Lista todas com cliente + itens + produto aninhados | — | 200 / 500 |
| `GET` | `/vendas/:id` | Busca uma com tudo aninhado | — | 200 / 404 / 500 |
| `POST` | `/vendas` | Registra venda em **transação** | 🔒 | 201 / 400 / 401 / 404 / 500 |
| `DELETE` | `/vendas/:id` | Devolução em **transação reversa** | 🔒 | 200 / 401 / 404 / 500 |

### Usuários `/usuarios` 🔐

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `GET` | `/usuarios` | Lista todos (senha nunca exposta) | 200 / 500 |
| `POST` | `/usuarios` | Cria com bcrypt e validação de senha forte | 201 / 400 / 409 / 500 |

### Autenticação e Recuperação de Senha 🔐

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `POST` | `/login` | Autentica e retorna token JWT | 200 / 400 / 401 / 403 / 404 / 500 |
| `POST` | `/recuperar-senha` | Envia código de 4 caracteres por e-mail | 200 / 400 / 500 |
| `POST` | `/alterar-senha` | Valida código e atualiza senha | 200 / 400 / 404 / 500 |

### Logs `/logs` 🔐 (rotas protegidas por token)

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `GET` | `/logs` | Lista todos com o nome do usuário | 200 / 401 / 500 |
| `GET` | `/logs/usuario/:id` | Filtra logs por usuário | 200 / 401 / 500 |

### E-mail `/email`

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `POST` | `/email/cliente/:id` | Envia histórico de compras por e-mail | 200 / 404 / 500 |

> 🔒 = rota protegida por middleware JWT (envie `Authorization: Bearer <token>` no header)

---

## 🔒 Transações ACID

O coração do Trabalho #1 está nas rotas de venda e devolução, que utilizam o **modo callback** do `prisma.$transaction` para garantir atomicidade em operações multi-tabela:

```ts
await prisma.$transaction(async (tx) => {
  const novaVenda = await tx.venda.create({ data: { clienteId, totalNF } })

  for (const item of itens) {
    await tx.itemVenda.create({ data: { vendaId: novaVenda.id, ... } })
    await tx.produto.update({
      where: { id: item.produtoId },
      data: { qtd: { decrement: item.qtd } }
    })
  }

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

## 🛡️ Segurança

O Trabalho #2 adiciona uma camada completa de segurança sobre a API do Trabalho #1.

### Criptografia de senhas

Nenhuma senha é armazenada em texto plano. O `bcrypt` gera um hash com 10 rounds de salt aleatório antes de gravar no banco:

```ts
const senhaHash = await bcrypt.hash(senha, 10)
// $2b$10$Q2K7Lp8h.Kq3F...
```

No login, a comparação usa `bcrypt.compare` sem jamais reverter o hash.

### Autenticação com JWT

Após um login bem-sucedido, o servidor emite um token JWT válido por 1 hora contendo `userId` e `email`. O cliente envia o token em `Authorization: Bearer <token>` nas rotas protegidas, e o middleware `verificaToken` valida a assinatura antes de liberar a execução da rota.

### Middleware em rotas críticas

Três rotas exigem autenticação:

- `POST /vendas` — impede que anônimos criem vendas
- `DELETE /vendas/:id` — impede devoluções não autorizadas
- `DELETE /produtos/:id` — impede exclusão de itens do catálogo por anônimos

Rotas de leitura (`GET /produtos`, `GET /vendas`, etc.) permanecem públicas por decisão de negócio.

### Recuperação de senha

Fluxo em duas etapas:

1. `POST /recuperar-senha` — recebe e-mail, gera código aleatório de 4 caracteres, salva no campo `codigoRecuperacao` do próprio Usuario e envia por e-mail via Nodemailer/Mailtrap
2. `POST /alterar-senha` — recebe e-mail + código + nova senha, valida a composição da nova senha via Zod, criptografa e atualiza

Por segurança, a primeira rota **sempre** responde 200 mesmo quando o e-mail não existe, evitando enumeração de contas.

### Auditoria via Log

A tabela `Log` (relacionada a Usuario) grava eventos sensíveis com `descricao`, `complemento` e `createdAt`. O sistema registra automaticamente:

- **LOGIN** — quando o login é bem-sucedido
- **TENTATIVA_LOGIN_INVALIDA** — inclui o contador atual (`Tentativa X/3`) e sinaliza bloqueio
- **SENHA_ALTERADA** — quando a senha é alterada via recuperação

Duas rotas expõem a consulta: `GET /logs` lista tudo com o nome do usuário; `GET /logs/usuario/:id` filtra por usuário.

### Recursos adicionais implementados

#### #3 Limite de tentativas → bloqueio
A cada senha errada, `tentativasInvalidas` é incrementado. Ao atingir 3, o campo `bloqueado` é setado como `true` e novos logins retornam **403 Forbidden** mesmo com a senha correta. Um administrador precisa desbloquear manualmente no banco.

#### #4 Data/hora do último login
O campo `ultimoLogin` do Usuario é atualizado a cada login bem-sucedido. A resposta do login inclui a mensagem "Bem-vindo... Seu último acesso foi em X" (ou "Este é o seu primeiro acesso ao sistema" na estreia).

#### #7 Soft Delete em Cliente
`DELETE /clientes/:id` não remove fisicamente o registro. Ele marca `deleted = true` e grava `deletedAt` com a data/hora. Todas as listagens filtram automaticamente `deleted = false`. Isso preserva o histórico de vendas do cliente e permite restauração posterior.

---

## 📁 Estrutura do Projeto

```
DSeAPIS_elinton_store/
├── docs/
│   └── evidencias/                    # prints de testes no Bruno por entregável
│       ├── 02-crud-basico/
│       ├── 03-venda-transacao/
│       ├── 04-devolucao-transacao/
│       ├── 05-envio-email/
│       └── 07-seguranca/
├── elinton_store/                     # aplicação Node
│   ├── .env.example
│   ├── .gitignore
│   ├── lib/
│   │   ├── prisma.ts                  # conexão única do Prisma Client
│   │   └── verificaToken.ts           # middleware JWT
│   ├── prisma/
│   │   ├── schema.prisma              # modelo de dados
│   │   └── migrations/                # migrations versionadas
│   ├── src/
│   │   ├── server.ts                  # bootstrap do Express
│   │   └── routes/
│   │       ├── produtos.ts            # CRUD Produtos
│   │       ├── clientes.ts            # CRUD Clientes + Soft Delete
│   │       ├── vendas.ts              # Venda + Devolução (transações)
│   │       ├── usuarios.ts            # Cadastro e listagem de usuários
│   │       ├── login.ts               # Autenticação com JWT
│   │       ├── recuperar-senha.ts     # Recuperação de senha (2 rotas)
│   │       ├── logs.ts                # Consulta de logs
│   │       └── email.ts               # Envio de e-mail
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
- **Mailtrap** com os e-mails recebidos
- **MySQL** confirmando estado do banco (senhas criptografadas, soft delete, etc.)

---

## 🌳 Fluxo de Versionamento

Desenvolvido seguindo padrão **Git Flow simplificado**:

```
main                          ← release oficial
 └── dev                      ← integração das features
      ├── feat/setup-inicial          (Trabalho #1)
      ├── feat/crud-basico            (Trabalho #1)
      ├── feat/venda-transacao        (Trabalho #1)
      ├── feat/devolucao-transacao    (Trabalho #1)
      ├── feat/envio-mail             (Trabalho #1)
      └── feature/seguranca           (Trabalho #2)
```

Cada feature foi entregue via **Pull Request** com commits granulares usando convenção `gitmoji`.

---

## 🎓 Contexto Acadêmico

- **Disciplina:** Desenvolvimento de Serviços e APIs
- **Curso:** CST em Análise e Desenvolvimento de Sistemas
- **Instituição:** Centro Universitário UniSenac - Campus Pelotas
- **Professor:** Edécio Fernando Iepsen
- **Trabalho #1:** APIs com tabelas relacionadas e transações (apresentado em 29/05/2026)
- **Trabalho #2:** Adicionar recursos de segurança em APIs (apresentação em 03/07/2026)

### Atividades cumpridas — Trabalho #1 (Conceito A)

| # | Atividade | Status |
|---|---|---|
| 1 | Proposta entregue | ✅ |
| 2 | Banco + schema + migration | ✅ |
| 3 | CRUD de Produtos e Clientes | ✅ |
| 4 | Venda com transação | ✅ |
| 5 | Devolução com transação reversa | ✅ |
| 6 | Envio de e-mail com histórico | ✅ |

### Atividades cumpridas — Trabalho #2 (Conceito A)

| # | Atividade | Status |
|---|---|---|
| 1 | Model Usuario com relacionamento (Log) | ✅ |
| 2 | Rotas de inclusão e listagem de usuários | ✅ |
| 3 | Criptografia da senha (bcrypt) | ✅ |
| 4 | Impedimento de e-mail duplicado | ✅ |
| 5 | Validação de composição da senha | ✅ |
| 6 | Login com geração de token JWT | ✅ |
| 7 | Middleware de verificação em rotas | ✅ |
| 8 | Recuperação de senha (2 rotas + e-mail) | ✅ |
| 9 | Model Log e ações registradas | ✅ |
| 10 | Recurso adicional #3 (limite de tentativas) | ✅ |
| 11 | Recurso adicional #4 (último login) | ✅ |
| 12 | Recurso adicional #7 (soft delete) | ✅ |

---

## 👤 Autor

**Elinton Souza Cunha**

- GitHub: [@Elinton-Souza](https://github.com/Elinton-Souza)
- E-mail: elintonsouzacunha@gmail.com

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos. Sinta-se à vontade para usá-lo como referência de estudo.

---

<p align="center">
  <i>Construído com ☕, transações ACID e camadas de segurança.</i>
</p>
