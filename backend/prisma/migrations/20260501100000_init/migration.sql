
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);


CREATE TABLE "categorias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

CREATE TABLE "solicitacoes_reembolso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitanteId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "dataDespesa" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "justificativaRejeicao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "solicitacoes_reembolso_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitacoes_reembolso_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "anexos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitacaoId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "tipoArquivo" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "anexos_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_reembolso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "historicos_solicitacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitacaoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "observacao" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historicos_solicitacao_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_reembolso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "historicos_solicitacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

