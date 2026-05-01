import request from "supertest";
import { sign } from "jsonwebtoken";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

jest.mock("../src/lib/prisma", () => ({
  prisma: {
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

describe("Envio de reembolsos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return callback(mockPrisma);
    });
  });

  it("deve enviar solicitacao em rascunho para analise", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1",
      status: "RASCUNHO"
    });
    mockPrisma.solicitacaoReembolso.update.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1",
      status: "ENVIADO"
    });
    mockPrisma.requestHistory.create.mockResolvedValueOnce({
      id: "history-1"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/enviar")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "reembolso-1",
      status: "ENVIADO"
    });
    expect(mockPrisma.solicitacaoReembolso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "reembolso-1" },
        data: { status: "ENVIADO" }
      })
    );
    expect(mockPrisma.requestHistory.create).toHaveBeenCalledWith({
      data: {
        solicitacaoId: "reembolso-1",
        usuarioId: "colaborador-1",
        acao: "SUBMITTED",
        observacao: "Solicitacao enviada para analise"
      }
    });
  });

  it("deve bloquear envio por colaborador que nao e dono", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "outro-colaborador",
      status: "RASCUNHO"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/enviar")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Usuario sem permissao");
    expect(mockPrisma.solicitacaoReembolso.update).not.toHaveBeenCalled();
  });

  it("deve bloquear envio quando status nao for rascunho", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1",
      status: "ENVIADO"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/enviar")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Apenas solicitacoes em rascunho podem ser enviadas");
    expect(mockPrisma.solicitacaoReembolso.update).not.toHaveBeenCalled();
  });
});

