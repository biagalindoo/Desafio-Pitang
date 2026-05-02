import request from "supertest";
import { sign } from "jsonwebtoken";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    category: {
      findUnique: jest.fn()
    },
    solicitacaoReembolso: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    requestHistory: {
      create: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

const mockPrisma = prisma as any;

function makeToken(perfil: string, subject = `${perfil.toLowerCase()}-1`) {
  return sign({ perfil }, "test-secret", {
    subject
  });
}

describe("Edicao e cancelamento de reembolsos em rascunho", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return callback(mockPrisma);
    });
  });

  it("deve editar solicitacao propria em rascunho", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1",
      status: "RASCUNHO"
    });
    mockPrisma.category.findUnique.mockResolvedValueOnce({
      id: "category-1",
      nome: "Transporte",
      ativo: true
    });
    mockPrisma.solicitacaoReembolso.update.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1",
      categoriaId: "category-1",
      descricao: "Taxi atualizado",
      valor: 55,
      status: "RASCUNHO"
    });

    const response = await request(app)
      .put("/reembolsos/reembolso-1")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`)
      .send({
        categoriaId: "category-1",
        descricao: "Taxi atualizado",
        valor: 55,
        dataDespesa: "2026-04-22"
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "reembolso-1",
      descricao: "Taxi atualizado",
      valor: 55
    });
    expect(mockPrisma.requestHistory.create).toHaveBeenCalledWith({
      data: {
        solicitacaoId: "reembolso-1",
        usuarioId: "colaborador-1",
        acao: "UPDATED",
        observacao: "Solicitacao de reembolso atualizada"
      }
    });
  });

  it("deve bloquear edicao quando colaborador nao for dono", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "outro-colaborador",
      status: "RASCUNHO"
    });

    const response = await request(app)
      .put("/reembolsos/reembolso-1")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`)
      .send({
        descricao: "Taxi atualizado"
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Usuario sem permissao");
    expect(mockPrisma.solicitacaoReembolso.update).not.toHaveBeenCalled();
  });

  it("deve bloquear edicao quando status nao for rascunho", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1",
      status: "ENVIADO"
    });

    const response = await request(app)
      .put("/reembolsos/reembolso-1")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`)
      .send({
        descricao: "Taxi atualizado"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Apenas solicitacoes em rascunho podem ser editadas");
    expect(mockPrisma.solicitacaoReembolso.update).not.toHaveBeenCalled();
  });

  it("deve cancelar solicitacao propria em rascunho", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1",
      status: "RASCUNHO"
    });
    mockPrisma.solicitacaoReembolso.update.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1",
      status: "CANCELADO"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/cancelar")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "reembolso-1",
      status: "CANCELADO"
    });
    expect(mockPrisma.requestHistory.create).toHaveBeenCalledWith({
      data: {
        solicitacaoId: "reembolso-1",
        usuarioId: "colaborador-1",
        acao: "CANCELED",
        observacao: "Solicitacao de reembolso cancelada"
      }
    });
  });

  it("deve bloquear cancelamento quando status nao for rascunho", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1",
      status: "ENVIADO"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/cancelar")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Apenas solicitacoes em rascunho podem ser canceladas");
    expect(mockPrisma.solicitacaoReembolso.update).not.toHaveBeenCalled();
  });
});

