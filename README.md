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

postman/
  desafio-pitang.postman_collection.json
```

## Fluxo principal do sistema

1. `ADMIN` gerencia usuarios e categorias.
2. `COLABORADOR` cria uma solicitacao de reembolso em `RASCUNHO`.
3. `COLABORADOR` pode editar, anexar comprovante simulado, cancelar ou enviar.
4. Ao enviar, a solicitacao passa para `ENVIADO`.
5. `GESTOR` aprova ou rejeita a solicitacao enviada.
6. Se aprovada, a solicitacao passa para `APROVADO`.
7. `FINANCEIRO` marca a solicitacao aprovada como `PAGO`.
8. As acoes relevantes geram historico de auditoria.

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
npm run prisma:seed
npm run dev
```

API: `http://localhost:3333`

O comando `prisma db execute` prepara o banco local. Se ele ja tiver sido
executado antes, a migration esta preparada para nao recriar tabelas existentes.
Depois disso, para usar no dia a dia, normalmente basta rodar `npm run dev`.
O comando `npm run prisma:seed` cria usuarios e categorias iniciais para teste.
Ele pode ser executado mais de uma vez sem duplicar os registros.

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

## Problemas comuns no setup

### `table "usuarios" already exists`

Isso indica que o banco local ja foi criado antes. Atualize o projeto, rode
novamente o comando `prisma db execute` se quiser garantir a estrutura, ou pule
essa etapa e inicie a API com:

```bash
npm run dev
```

### `EADDRINUSE: address already in use :::3333`

Isso indica que ja existe uma API rodando na porta `3333`. Verifique se ela esta
ativa acessando:

```txt
http://localhost:3333/health
```

Se retornar status `200`, mantenha esse terminal aberto e rode apenas o frontend
em outro terminal. Se quiser encerrar o processo antigo no Windows, descubra o
PID e finalize manualmente:

```bash
netstat -ano | findstr :3333
taskkill /PID <PID_ENCONTRADO> /F
```

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
npm run prisma:seed
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

## Postman

O projeto inclui uma collection para facilitar os testes manuais da API:

```txt
postman/desafio-pitang.postman_collection.json
```

Como usar:

1. Importar a collection no Postman.
2. Rodar backend e seed.
3. Executar `Health`.
4. Executar um login conforme o perfil que deseja testar.
5. Usar as requisicoes de categorias e reembolsos.

A collection possui variaveis para `baseUrl`, `token`, `categoriaId` e
`reembolsoId`. Os logins salvam o token automaticamente e algumas requisicoes
salvam IDs para reutilizar nas proximas chamadas.

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
- `GET /reembolsos?status=ENVIADO&categoriaId=<id>&ordenacao=MAIOR_VALOR` filtra e ordena solicitacoes
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

## Usuarios de teste

O projeto possui seed inicial para facilitar a avaliacao. Apos preparar o banco,
rode:

```bash
cd backend
npm run prisma:seed
```

Esse comando cria os usuarios abaixo com senha `123456`:

| Nome | E-mail | Senha | Perfil |
| --- | --- | --- | --- |
| Admin | admin@email.com | 123456 | ADMIN |
| Colaborador | colaborador@email.com | 123456 | COLABORADOR |
| Gestor | gestor@email.com | 123456 | GESTOR |
| Financeiro | financeiro@email.com | 123456 | FINANCEIRO |

O seed tambem cria as categorias iniciais: `Alimentacao`, `Transporte`,
`Hospedagem` e `Material de trabalho`.

Fluxo sugerido para teste manual:

1. Rodar o seed.
2. Entrar como `COLABORADOR`, criar uma solicitacao, anexar comprovante e enviar.
3. Entrar como `GESTOR`, aprovar ou rejeitar a solicitacao enviada.
4. Entrar como `FINANCEIRO` e marcar como paga quando estiver aprovada.
5. Entrar como `ADMIN` caso queira gerenciar categorias ou usuarios.

## Funcionalidades implementadas

### Backend

- Cadastro e login com JWT.
- Middleware de autenticacao e autorizacao por perfil.
- CRUD de categorias.
- CRUD base de solicitacoes de reembolso.
- Filtros de solicitacoes por status e categoria.
- Ordenacao de solicitacoes por data da despesa ou valor.
- Envio, aprovacao, rejeicao, pagamento e cancelamento de solicitacoes.
- Historico de auditoria.
- Anexos simulados.
- Seeds iniciais para usuarios e categorias de teste.
- Collection do Postman para testes manuais da API.
- Tratamento padronizado de erros HTTP.
- Testes de integracao das rotas principais.

### Frontend

- Login e cadastro.
- Rotas protegidas.
- Dashboard com listagem, filtros, ordenacao e totais das solicitacoes visiveis.
- Nova solicitacao.
- Edicao de solicitacao em rascunho.
- Detalhe com dados, anexos, historico e acoes por perfil/status.
- Gestao de categorias para admin.
- Testes com React Testing Library para telas principais.

## Pendencias conhecidas

- Upload real de arquivos nao foi implementado, pois o desafio permite anexo
  simulado no escopo obrigatorio.
- Refresh token, Docker Compose e paginacao
  ficaram fora do escopo atual por serem diferenciais opcionais.
- A interface prioriza os fluxos obrigatorios e pode receber refinamentos visuais
  adicionais depois do fluxo principal estar validado.

## Como validar rapidamente

Depois de rodar backend, frontend e seed:

1. Entrar como `ADMIN` e conferir categorias.
2. Entrar como `COLABORADOR` e criar uma solicitacao.
3. Ainda como `COLABORADOR`, testar editar, anexar e enviar.
4. Entrar como `GESTOR` e aprovar ou rejeitar.
5. Entrar como `FINANCEIRO` e pagar uma solicitacao aprovada.
6. Entrar como `ADMIN` e testar filtros, ordenacao e totais no dashboard.

Comandos de validacao automatizada:

```bash
cd backend
npm test
npm run build

cd ../frontend
npm test -- --runInBand
npm run build
```

## Decisoes tecnicas

- Prisma foi escolhido em vez de Sequelize para usar schema e migrations.
- SQLite foi escolhido para facilitar execucao local da entrega.
- Como SQLite nao suporta `enum` nativo no Prisma, os campos de perfil, status
  e acao ficam como `String` no banco e sao validados no TypeScript/Zod.
- Anexos foram implementados de forma simulada, conforme permitido no desafio.
- Seeds foram adicionados como diferencial simples para facilitar a avaliacao local.
- A collection do Postman foi incluida para demonstrar os testes manuais dos
  principais endpoints da API.
- Filtros por status e categoria foram adicionados como diferencial sem alterar
  as regras de permissao por perfil.
- Ordenacao por data da despesa e valor foi adicionada na listagem para facilitar
  a analise das solicitacoes.
- O dashboard calcula totais no frontend a partir das solicitacoes visiveis,
  acompanhando filtros e ordenacao sem criar uma rota extra.
- Todas as acoes relevantes de reembolso registram historico de auditoria.
