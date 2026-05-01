import { Request, Response } from "express";
import { Roles } from "../constants/enums";
import { AppError } from "../errors/app-error";
import { prisma } from "../lib/prisma";

export class AnexosController {
  async index(request: Request, response: Response) {
    const user = request.user;
    const solicitacaoId = String(request.params.id);

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    await this.ensureCanAccessSolicitacao(solicitacaoId, user.id, user.perfil);

    const anexos = await prisma.attachment.findMany({
      where: {
        solicitacaoId
      },
      orderBy: {
        criadoEm: "asc"
      }
    });

    return response.status(200).json(anexos);
  }

  async create(request: Request, response: Response) {
    const user = request.user;
    const solicitacaoId = String(request.params.id);
    const { nomeArquivo, urlArquivo, tipoArquivo } = request.body;

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    await this.ensureCanAttachToSolicitacao(solicitacaoId, user.id, user.perfil);

    const anexo = await prisma.attachment.create({
      data: {
        solicitacaoId,
        nomeArquivo,
        urlArquivo,
        tipoArquivo
      }
    });

    return response.status(201).json(anexo);
  }

  private async ensureCanAccessSolicitacao(
    solicitacaoId: string,
    userId: string,
    role: string
  ) {
    const solicitacao = await prisma.solicitacaoReembolso.findUnique({
      where: { id: solicitacaoId },
      select: {
        solicitanteId: true
      }
    });

    if (!solicitacao) {
      throw new AppError("Solicitacao nao encontrada", 404, "Not Found");
    }

    if (role === Roles.COLABORADOR && solicitacao.solicitanteId !== userId) {
      throw new AppError("Usuario sem permissao", 403, "Forbidden");
    }
  }

  private async ensureCanAttachToSolicitacao(
    solicitacaoId: string,
    userId: string,
    role: string
  ) {
    const solicitacao = await prisma.solicitacaoReembolso.findUnique({
      where: { id: solicitacaoId },
      select: {
        solicitanteId: true
      }
    });

    if (!solicitacao) {
      throw new AppError("Solicitacao nao encontrada", 404, "Not Found");
    }

    if (role !== Roles.COLABORADOR || solicitacao.solicitanteId !== userId) {
      throw new AppError("Usuario sem permissao", 403, "Forbidden");
    }
  }
}

