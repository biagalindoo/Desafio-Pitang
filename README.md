# Desafio Pitang - Controle de Reembolsos

Projeto do desafio tecnico para controle de solicitacoes de reembolso.

## Stack obrigatoria

- Backend: Node.js, Express.js e TypeScript
- Validacao: Zod
- Autenticacao: JWT
- Banco/ORM: Prisma
- Datas: DayJS
- Testes backend: Jest e Supertest
- Frontend: React, React Router, Context API e CSS/UI

## Estrutura inicial

```txt
backend/
  prisma/
    schema.prisma
  src/
    app.ts
    server.ts
```

## Como rodar o backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

API: `http://localhost:3333`

