# Desafio Pitang - Controle de Reembolsos

Sistema para cadastro, envio, analise, pagamento e auditoria de solicitacoes de
reembolso.

O backend implementa API REST com autenticacao JWT, controle de permissao por
perfil, validacoes com Zod, persistencia com Prisma e testes de integracao com
Jest e Supertest. O frontend implementa a interface em React com rotas protegidas,
Context API para autenticacao e consumo da API com Axios.

## Stack obrigatoria

- Backend: Node.js, Express.js e TypeScript
- Validacao: Zod
- Autenticacao: JWT
- Banco/ORM: Prisma
- Datas: DayJS e Intl
- Testes backend: Jest e Supertest
- Frontend: React com Functional Components e Hooks
- Navegacao: React Router
- Estado global: Context API
- Consumo de API: Axios
- Testes frontend: Jest e React Testing Library
- UI: CSS proprio

## Estrutura do projeto

```txt
backend/
  prisma/
    migrations/
    schema.prisma
  src/
    controllers/
    middlewares/
    routes/
    schemas/
    app.ts
    server.ts
  tests/

frontend/
  src/
    contexts/
    pages/
    routes/
    tests/
```

## Como rodar clonando o repositorio no Windows

### Backend

```bash
git clone <url-do-repositorio>
cd Desafio-Pitang
cd backend
npm install
copy .env.example .env
npx prisma generate
npx prisma db execute --file prisma/migrations/20260501100000_init/migration.sql --schema prisma/schema.prisma
npm run dev
```

API: `http://localhost:3333`

### Frontend

Em outro terminal:

```bash
cd Desafio-Pitang
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

No Linux/macOS, substitua os comandos de copia do `.env` por:

```bash
cp .env.example .env
```

## Banco de dados

O banco usado no desenvolvimento e na entrega local e SQLite via Prisma. Isso
evita que a pessoa avaliadora precise instalar Postgres ou MySQL para testar o
projeto. O arquivo `dev.db` e gerado localmente e nao deve ser versionado.

A estrutura do banco esta versionada em:

```txt
backend/prisma/migrations/20260501100000_init/migration.sql
```

Caso prefira usar o fluxo padrao do Prisma na sua maquina, tambem pode tentar:

```bash
npx prisma migrate dev
```

Se esse comando falhar por causa do ambiente local, use o comando documentado
com `prisma db execute`, que aplica a migration SQL versionada.

## Variaveis de ambiente

### Backend

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="troque-esta-chave-em-desenvolvimento"
PORT=3333
```

### Frontend

```env
VITE_API_URL=http://localhost:3333
```

## Scripts do backend

```bash
npm run dev
npm run build
npm start
npm test
npm run prisma:generate
```

## Scripts do frontend

```bash
npm run dev
npm run build
npm run preview
npm test
```

## Testes

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm test -- --runInBand
```

## Rotas principais

### Autenticacao e usuarios

- `POST /users` cria usuario
- `GET /users` lista usuarios, somente `ADMIN`
- `POST /auth/login` autentica e retorna JWT

### Categorias

- `GET /categories` lista categorias
- `POST /categories` cria categoria, somente `ADMIN`
- `PUT /categories/:id` atualiza ou inativa categoria, somente `ADMIN`

### Reembolsos

- `GET /reembolsos` lista solicitacoes conforme perfil
- `POST /reembolsos` cria solicitacao, somente `COLABORADOR`
- `GET /reembolsos/:id` detalha solicitacao
- `PUT /reembolsos/:id` edita solicitacao propria em `RASCUNHO`
- `POST /reembolsos/:id/cancelar` cancela solicitacao propria em `RASCUNHO`
- `POST /reembolsos/:id/enviar` envia solicitacao para analise
- `POST /reembolsos/:id/aprovar` aprova solicitacao, somente `GESTOR`
- `POST /reembolsos/:id/rejeitar` rejeita solicitacao, somente `GESTOR`
- `POST /reembolsos/:id/pagar` marca como paga, somente `FINANCEIRO`
- `GET /reembolsos/:id/historico` lista historico da solicitacao
- `GET /reembolsos/:id/anexos` lista anexos simulados
- `POST /reembolsos/:id/anexos` cria anexo simulado

## Perfis

- `ADMIN`: gerencia categorias e usuarios
- `COLABORADOR`: cria, edita, envia, cancela e anexa comprovantes nas proprias solicitacoes
- `GESTOR`: aprova ou rejeita solicitacoes enviadas
- `FINANCEIRO`: marca solicitacoes aprovadas como pagas

## Funcionalidades implementadas

### Backend

- Cadastro e login com JWT.
- Middleware de autenticacao e autorizacao por perfil.
- CRUD de categorias.
- CRUD base de solicitacoes de reembolso.
- Envio, aprovacao, rejeicao, pagamento e cancelamento de solicitacoes.
- Historico de auditoria.
- Anexos simulados.
- Tratamento padronizado de erros HTTP.
- Testes de integracao das rotas principais.

### Frontend

- Login e cadastro.
- Rotas protegidas.
- Dashboard com listagem de solicitacoes.
- Nova solicitacao.
- Edicao de solicitacao em rascunho.
- Detalhe com dados, anexos, historico e acoes por perfil/status.
- Gestao de categorias para admin.
- Testes com React Testing Library para telas principais.

## Decisoes tecnicas

- Prisma foi escolhido em vez de Sequelize para usar schema e migrations.
- SQLite foi escolhido para facilitar execucao local da entrega.
- Como SQLite nao suporta `enum` nativo no Prisma, os campos de perfil, status
  e acao ficam como `String` no banco e sao validados no TypeScript/Zod.
- Anexos foram implementados de forma simulada, conforme permitido no desafio.
- Todas as acoes relevantes de reembolso registram historico de auditoria.
