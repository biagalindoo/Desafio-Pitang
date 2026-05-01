import request from "supertest";
import { hashSync } from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    solicitacaoReembolso: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    requestHistory: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    attachment: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

const mockPrisma = prisma as any;

describe("Rotas de autenticacao e usuarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar o status de saude da API", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("deve criar usuario com senha criptografada", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockPrisma.user.create.mockResolvedValueOnce({
      id: "user-1",
      nome: "Admin",
      email: "admin@email.com",
      perfil: "ADMIN",
      criadoEm: new Date(),
      atualizadoEm: new Date()
    });

    const response = await request(app).post("/users").send({
      nome: "Admin",
      email: "ADMIN@EMAIL.COM",
      senha: "123456",
      perfil: "ADMIN"
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: "user-1",
      nome: "Admin",
      email: "admin@email.com",
      perfil: "ADMIN"
    });
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "admin@email.com",
          senha: expect.not.stringMatching("123456")
        })
      })
    );
  });

  it("deve autenticar usuario valido e retornar um JWT", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      nome: "Admin",
      email: "admin@email.com",
      senha: hashSync("123456", 8),
      perfil: "ADMIN"
    });

    const response = await request(app).post("/auth/login").send({
      email: "admin@email.com",
      senha: "123456"
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: "user-1",
      email: "admin@email.com",
      perfil: "ADMIN"
    });
  });

  it("deve rejeitar credenciais invalidas", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const response = await request(app).post("/auth/login").send({
      email: "missing@email.com",
      senha: "123456"
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credenciais invalidas");
  });
});
