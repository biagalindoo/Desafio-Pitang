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

describe("Pagamento de reembolsos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return callback(mockPrisma);
    });
  });

  it("deve marcar solicitacao aprovada como paga", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      status: "APROVADO"
    });
    mockPrisma.solicitacaoReembolso.update.mockResolvedValueOnce({
      id: "reembolso-1",
      status: "PAGO"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/pagar")
      .set("Authorization", `Bearer ${makeToken("FINANCEIRO", "financeiro-1")}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "reembolso-1",
      status: "PAGO"
    });
    expect(mockPrisma.solicitacaoReembolso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "reembolso-1" },
        data: { status: "PAGO" }
      })
    );
    expect(mockPrisma.requestHistory.create).toHaveBeenCalledWith({
      data: {
        solicitacaoId: "reembolso-1",
        usuarioId: "financeiro-1",
        acao: "PAID",
        observacao: "Pagamento realizado pelo financeiro"
      }
    });
  });

  it("deve bloquear pagamento por perfil diferente de financeiro", async () => {
    const response = await request(app)
      .post("/reembolsos/reembolso-1/pagar")
      .set("Authorization", `Bearer ${makeToken("GESTOR", "gestor-1")}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Apenas o financeiro pode marcar solicitacoes como pagas"
    );
    expect(mockPrisma.solicitacaoReembolso.update).not.toHaveBeenCalled();
  });

  it("deve bloquear pagamento quando status nao for aprovado", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      status: "ENVIADO"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/pagar")
      .set("Authorization", `Bearer ${makeToken("FINANCEIRO", "financeiro-1")}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Apenas solicitacoes aprovadas podem ser pagas");
    expect(mockPrisma.solicitacaoReembolso.update).not.toHaveBeenCalled();
  });
});

