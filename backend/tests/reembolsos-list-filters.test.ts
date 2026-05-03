import request from "supertest";
import { sign } from "jsonwebtoken";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    solicitacaoReembolso: {
      findMany: jest.fn()
    }
  }
}));

const mockPrisma = prisma as any;

function makeToken(perfil: string) {
  return sign({ perfil }, "test-secret", {
    subject: `${perfil.toLowerCase()}-1`
  });
}

describe("Filtros de listagem de reembolsos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve filtrar por status e categoria mantendo o escopo do colaborador", async () => {
    mockPrisma.solicitacaoReembolso.findMany.mockResolvedValueOnce([]);

    const response = await request(app)
      .get("/reembolsos?status=RASCUNHO&categoriaId=category-1")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR")}`);

    expect(response.status).toBe(200);
    expect(mockPrisma.solicitacaoReembolso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { solicitanteId: "colaborador-1" },
            { status: "RASCUNHO" },
            { categoriaId: "category-1" }
          ]
        }
      })
    );
  });

  it("deve filtrar por categoria para admin sem restringir por perfil", async () => {
    mockPrisma.solicitacaoReembolso.findMany.mockResolvedValueOnce([]);

    const response = await request(app)
      .get("/reembolsos?categoriaId=category-1")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`);

    expect(response.status).toBe(200);
    expect(mockPrisma.solicitacaoReembolso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ categoriaId: "category-1" }]
        }
      })
    );
  });

  it("deve bloquear status invalido no filtro", async () => {
    const response = await request(app)
      .get("/reembolsos?status=INVALIDO")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Erro de validacao");
    expect(mockPrisma.solicitacaoReembolso.findMany).not.toHaveBeenCalled();
  });
});
