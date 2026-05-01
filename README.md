# Desafio Pitang - Controle de Reembolsos

Projeto do desafio tecnico para controle de solicitacoes de reembolso.

## Sobre o projeto

API REST para cadastro, envio, analise, pagamento e auditoria de solicitacoes
de reembolso. O backend implementa autenticacao com JWT, controle de permissao
por perfil, validacoes com Zod, persistencia com Prisma e testes de integracao
com Jest e Supertest.

## Stack obrigatoria

- Backend: Node.js, Express.js e TypeScript
- Validacao: Zod
- Autenticacao: JWT
- Banco/ORM: Prisma
- Datas: DayJS
- Testes backend: Jest e Supertest
- Frontend: React, React Router, Context API e CSS/UI

## Estrutura do projeto

```txt
backend/
  prisma/
    migrations/
    schema.prisma
  src/
    app.ts
    server.ts
    controllers/
    middlewares/
    routes/
    schemas/
  tests/
```

## Como rodar clonando o repositorio

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

No Linux/macOS, substitua o comando de copia do `.env` por:

```bash
cp .env.example .env
```

## Banco de dados

O banco usado no desenvolvimento e na entrega local e SQLite via Prisma.
Isso evita que a pessoa avaliadora precise instalar Postgres ou MySQL para testar
o projeto. O arquivo `dev.db` e gerado localmente e nao deve ser versionado.

A estrutura do banco esta versionada em:

```txt
backend/prisma/migrations/20260501100000_init/migration.sql
```

Caso prefira usar o fluxo padrao do Prisma na sua maquina, tambem pode tentar:

```bash
npx prisma migrate dev
```

Se esse comando falhar por causa do ambiente local, use o comando documentado com
`prisma db execute`, que aplica a migration SQL versionada.

## Scripts do backend

```bash
npm run dev             
npm run build            
npm start                
npm test                 
npm run prisma:generate  
```

## Testes do backend

```bash
cd backend
npm test
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

## Decisoes tecnicas

- Prisma foi escolhido em vez de Sequelize para usar schema e migrations.
- SQLite foi escolhido para facilitar execucao local da entrega.
- Como SQLite nao suporta `enum` nativo no Prisma, os campos de perfil, status
  e acao ficam como `String` no banco e sao validados no TypeScript/Zod.
- Anexos foram implementados de forma simulada, conforme permitido no desafio.
- Todas as acoes relevantes de reembolso registram historico de auditoria.
