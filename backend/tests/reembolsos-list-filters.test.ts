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

describe("Filtros e ordenacao de listagem de reembolsos", () => {
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

  it("deve ordenar por maior valor", async () => {
    mockPrisma.solicitacaoReembolso.findMany.mockResolvedValueOnce([]);

    const response = await request(app)
      .get("/reembolsos?ordenacao=MAIOR_VALOR")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`);

    expect(response.status).toBe(200);
    expect(mockPrisma.solicitacaoReembolso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          valor: "desc"
        }
      })
    );
  });

  it("deve ordenar por data da despesa mais antiga", async () => {
    mockPrisma.solicitacaoReembolso.findMany.mockResolvedValueOnce([]);

    const response = await request(app)
      .get("/reembolsos?ordenacao=MAIS_ANTIGAS")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`);

    expect(response.status).toBe(200);
    expect(mockPrisma.solicitacaoReembolso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          dataDespesa: "asc"
        }
      })
    );
  });

  it("deve ordenar por data da despesa mais recente por padrao", async () => {
    mockPrisma.solicitacaoReembolso.findMany.mockResolvedValueOnce([]);

    const response = await request(app)
      .get("/reembolsos")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`);

    expect(response.status).toBe(200);
    expect(mockPrisma.solicitacaoReembolso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          dataDespesa: "desc"
        }
      })
    );
  });

  it("deve bloquear ordenacao invalida", async () => {
    const response = await request(app)
      .get("/reembolsos?ordenacao=INVALIDA")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Erro de validacao");
    expect(mockPrisma.solicitacaoReembolso.findMany).not.toHaveBeenCalled();
  });
});
