import request from "supertest";
import { sign } from "jsonwebtoken";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    solicitacaoReembolso: {
      findUnique: jest.fn()
    },
    attachment: {
      create: jest.fn(),
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

describe("Anexos simulados", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve listar anexos de solicitacao propria", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      solicitanteId: "colaborador-1"
    });
    mockPrisma.attachment.findMany.mockResolvedValueOnce([
      {
        id: "anexo-1",
        solicitacaoId: "reembolso-1",
        nomeArquivo: "comprovante.pdf",
        urlArquivo: "https://arquivos.local/comprovante.pdf",
        tipoArquivo: "application/pdf"
      }
    ]);

    const response = await request(app)
      .get("/reembolsos/reembolso-1/anexos")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: "anexo-1",
      nomeArquivo: "comprovante.pdf",
      tipoArquivo: "application/pdf"
    });
  });

  it("deve criar anexo simulado em solicitacao propria", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      solicitanteId: "colaborador-1"
    });
    mockPrisma.attachment.create.mockResolvedValueOnce({
      id: "anexo-1",
      solicitacaoId: "reembolso-1",
      nomeArquivo: "comprovante.png",
      urlArquivo: "https://arquivos.local/comprovante.png",
      tipoArquivo: "image/png"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/anexos")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`)
      .send({
        nomeArquivo: "comprovante.png",
        urlArquivo: "https://arquivos.local/comprovante.png",
        tipoArquivo: "image/png"
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: "anexo-1",
      nomeArquivo: "comprovante.png",
      tipoArquivo: "image/png"
    });
    expect(mockPrisma.attachment.create).toHaveBeenCalledWith({
      data: {
        solicitacaoId: "reembolso-1",
        nomeArquivo: "comprovante.png",
        urlArquivo: "https://arquivos.local/comprovante.png",
        tipoArquivo: "image/png"
      }
    });
  });

  it("deve bloquear tipo de arquivo invalido", async () => {
    const response = await request(app)
      .post("/reembolsos/reembolso-1/anexos")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`)
      .send({
        nomeArquivo: "planilha.xlsx",
        urlArquivo: "https://arquivos.local/planilha.xlsx",
        tipoArquivo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Erro de validacao");
    expect(mockPrisma.attachment.create).not.toHaveBeenCalled();
  });

  it("deve bloquear anexo por colaborador que nao e dono", async () => {
    mockPrisma.solicitacaoReembolso.findUnique.mockResolvedValueOnce({
      solicitanteId: "outro-colaborador"
    });

    const response = await request(app)
      .post("/reembolsos/reembolso-1/anexos")
      .set("Authorization", `Bearer ${makeToken("COLABORADOR", "colaborador-1")}`)
      .send({
        nomeArquivo: "comprovante.pdf",
        urlArquivo: "https://arquivos.local/comprovante.pdf",
        tipoArquivo: "application/pdf"
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Usuario sem permissao");
    expect(mockPrisma.attachment.create).not.toHaveBeenCalled();
  });
});
