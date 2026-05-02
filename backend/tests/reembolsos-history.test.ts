import request from "supertest";
import { sign } from "jsonwebtoken";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    solicitacaoReembolso: {
      findUnique: jest.fn()
    },
    requestHistory: {
      findMany: jest.fn()
    }
  }
}));

const mockPrisma = prisma as any;

function makeToken(perfil: string, subject = `${perfil.toLowerCase()}-1`) {
  return sign({ perfil }, "test-secret", {
    subject
  });
}

describe("Historico de reembolsos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve listar historico da solicitacao em ordem cronologica", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1"
    });
    mockPrisma.requestHistory.findMany.mockResolvedValueOnce([
      {
        id: "history-1",
        solicitacaoId: "reembolso-1",
        usuarioId: "colaborador-1",
        acao: "CREATED",
        observacao: "Solicitacao de reembolso criada",
        usuario: {
          id: "colaborador-1",
          nome: "Colaborador",
          email: "colaborador@email.com",
          perfil: "COLABORADOR"
        }
      }
    ]);

    const response = await request(app)
      .get("/reembolsos/reembolso-1/historico")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: "history-1",
      acao: "CREATED",
      observacao: "Solicitacao de reembolso criada",
      usuario: {
        id: "colaborador-1",
        perfil: "COLABORADOR"
      }
    });
    expect(mockPrisma.requestHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          solicitacaoId: "reembolso-1"
        },
        orderBy: {
          criadoEm: "asc"
        }
      })
    );
  });

  it("deve retornar 404 quando solicitacao nao existir", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce(null);

    const response = await request(app)
      .get("/reembolsos/reembolso-1/historico")
      .set("Authorization", `Bearer ${makeToken("GESTOR", "gestor-1")}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Solicitacao nao encontrada");
    expect(mockPrisma.requestHistory.findMany).not.toHaveBeenCalled();
  });

  it("deve bloquear historico para colaborador que nao e dono", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "outro-colaborador"
    });

    const response = await request(app)
      .get("/reembolsos/reembolso-1/historico")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Usuario sem permissao");
    expect(mockPrisma.requestHistory.findMany).not.toHaveBeenCalled();
  });
});

