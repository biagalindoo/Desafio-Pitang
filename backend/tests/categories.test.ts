import request from "supertest";
import { sign } from "jsonwebtoken";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

const mockPrisma = prisma as any;

function makeToken(perfil: string) {
  return sign({ perfil }, "test-secret", {
    subject: `${perfil.toLowerCase()}-1`
  });
}

describe("Rotas de categorias", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve listar categorias ativas para usuarios autenticados", async () => {
    mockPrisma.category.findMany.mockResolvedValueOnce([
      {
        id: "category-1",
        nome: "Transporte",
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      }
    ]);

    const response = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR")}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: "category-1",
      nome: "Transporte",
      ativo: true
    });
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ativo: true }
      })
    );
  });

  it("deve criar categoria quando usuario for admin", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce(null);
    mockPrisma.category.create.mockResolvedValueOnce({
      id: "category-1",
      nome: "Alimentacao",
      ativo: true,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    });

    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`)
      .send({
        nome: "Alimentacao"
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: "category-1",
      nome: "Alimentacao",
      ativo: true
    });
    expect(mockPrisma.category.create).toHaveBeenCalledWith({
      data: {
        nome: "Alimentacao"
      }
    });
  });

  it("deve bloquear criacao de categoria por colaborador", async () => {
    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR")}`)
      .send({
        nome: "Hospedagem"
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Usuario sem permissao");
    expect(mockPrisma.category.create).not.toHaveBeenCalled();
  });

  it("deve bloquear categoria duplicada", async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce({
      id: "category-1",
      nome: "Transporte",
      ativo: true
    });

    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`)
      .send({
        nome: "Transporte"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Categoria ja cadastrada");
    expect(mockPrisma.category.create).not.toHaveBeenCalled();
  });
});

