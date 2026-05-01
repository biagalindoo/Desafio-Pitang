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
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    requestHistory: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

const mockPrisma = prisma as any;

function makeToken(perfil: string) {
  return sign({ perfil }, "test-secret", {
    subject: `${perfil.toLowerCase()}-1`
  });
}

describe("Criacao de reembolsos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return callback(mockPrisma);
    });
  });

  it("deve criar solicitacao de reembolso com categoria ativa", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({
      id: "category-1",
      nome: "Transporte",
      ativo: true
    });
    mockPrisma.solicitacaoReembolso.create.mockResolvedValueOnce({
      id: "reembolso-1",
      solicitanteId: "colaborador-1",
      categoriaId: "category-1",
      descricao: "Taxi para visita ao cliente",
      valor: 42.5,
      dataDespesa: new Date("2026-04-20T00:00:00.000Z"),
      status: "RASCUNHO",
      categoria: {
        id: "category-1",
        nome: "Transporte",
        ativo: true
      }
    });
    mockPrisma.requestHistory.create.mockResolvedValueOnce({
      id: "history-1"
    });

    const response = await request(app)
      .post("/reembolsos")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR")}`)
      .send({
        categoriaId: "category-1",
        descricao: "Taxi para visita ao cliente",
        valor: 42.5,
        dataDespesa: "2026-04-20"
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: "reembolso-1",
      categoriaId: "category-1",
      descricao: "Taxi para visita ao cliente",
      status: "RASCUNHO"
    });
    expect(mockPrisma.solicitacaoReembolso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          solicitanteId: "colaborador-1",
          categoriaId: "category-1",
          valor: 42.5
        })
      })
    );
    expect(mockPrisma.requestHistory.create).toHaveBeenCalledWith({
      data: {
        solicitacaoId: "reembolso-1",
        usuarioId: "colaborador-1",
        acao: "CREATED",
        observacao: "Solicitacao de reembolso criada"
      }
    });
  });

  it("deve bloquear criacao por perfil diferente de colaborador", async () => {
    const response = await request(app)
      .post("/reembolsos")
      .set("Authorization", `Bearer ${makeToken("GESTOR")}`)
      .send({
        categoriaId: "category-1",
        descricao: "Taxi para visita ao cliente",
        valor: 42.5,
        dataDespesa: "2026-04-20"
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Apenas colaboradores podem criar solicitacoes");
    expect(mockPrisma.solicitacaoReembolso.create).not.toHaveBeenCalled();
  });

  it("deve bloquear categoria inexistente ou inativa", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({
      id: "category-1",
      nome: "Transporte",
      ativo: false
    });

    const response = await request(app)
      .post("/reembolsos")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR")}`)
      .send({
        categoriaId: "category-1",
        descricao: "Taxi para visita ao cliente",
        valor: 42.5,
        dataDespesa: "2026-04-20"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Categoria nao encontrada ou inativa");
    expect(mockPrisma.solicitacaoReembolso.create).not.toHaveBeenCalled();
  });

  it("deve validar valor maior que zero", async () => {
    const response = await request(app)
      .post("/reembolsos")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR")}`)
      .send({
        categoriaId: "category-1",
        descricao: "Taxi",
        valor: 0,
        dataDespesa: "2026-04-20"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Erro de validacao");
    expect(mockPrisma.solicitacaoReembolso.create).not.toHaveBeenCalled();
  });
});

