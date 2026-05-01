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

describe("Analise de reembolsos pelo gestor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return callback(mockPrisma);
    });
  });

  it("deve aprovar solicitacao enviada", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      status: "ENVIADO"
    });
    mockPrisma.solicitacaoReembolso.update.mockResolvedValueOnce({
      id: "reembolso-1",
      status: "APROVADO"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/aprovar")
      .set("Authorization", `Bearer ${makeToken("GESTOR", "gestor-1")}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "reembolso-1",
      status: "APROVADO"
    });
    expect(mockPrisma.solicitacaoReembolso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "reembolso-1" },
        data: {
          status: "APROVADO",
          justificativaRejeicao: null
        }
      })
    );
    expect(mockPrisma.requestHistory.create).toHaveBeenCalledWith({
      data: {
        solicitacaoId: "reembolso-1",
        usuarioId: "gestor-1",
        acao: "APPROVED",
        observacao: "Solicitacao aprovada pelo gestor"
      }
    });
  });

  it("deve rejeitar solicitacao enviada com justificativa", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      status: "ENVIADO"
    });
    mockPrisma.solicitacaoReembolso.update.mockResolvedValueOnce({
      id: "reembolso-1",
      status: "REJEITADO",
      justificativaRejeicao: "Comprovante ilegivel"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/rejeitar")
      .set("Authorization", `Bearer ${makeToken("GESTOR", "gestor-1")}`)
      .send({
        justificativaRejeicao: "Comprovante ilegivel"
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "reembolso-1",
      status: "REJEITADO",
      justificativaRejeicao: "Comprovante ilegivel"
    });
    expect(mockPrisma.requestHistory.create).toHaveBeenCalledWith({
      data: {
        solicitacaoId: "reembolso-1",
        usuarioId: "gestor-1",
        acao: "REJECTED",
        observacao: "Comprovante ilegivel"
      }
    });
  });

  it("deve exigir justificativa ao rejeitar", async () => {
    const response = await request(app)
      .post("/reembolsos/reembolso-1/rejeitar")
      .set("Authorization", `Bearer ${makeToken("GESTOR", "gestor-1")}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Erro de validacao");
    expect(mockPrisma.solicitacaoReembolso.update).not.toHaveBeenCalled();
  });

  it("deve bloquear aprovacao por perfil diferente de gestor", async () => {
    const response = await request(app)
      .post("/reembolsos/reembolso-1/aprovar")
      .set("Authorization", `Bearer ${makeToken("FINANCEIRO", "financeiro-1")}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Apenas gestores podem aprovar solicitacoes");
    expect(mockPrisma.solicitacaoReembolso.update).not.toHaveBeenCalled();
  });

  it("deve bloquear aprovacao quando status nao for enviado", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      status: "RASCUNHO"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/aprovar")
      .set("Authorization", `Bearer ${makeToken("GESTOR", "gestor-1")}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Apenas solicitacoes enviadas podem ser aprovadas");
    expect(mockPrisma.solicitacaoReembolso.update).not.toHaveBeenCalled();
  });
});

