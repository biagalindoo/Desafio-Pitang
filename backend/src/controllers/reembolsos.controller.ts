import dayjs from "dayjs";
import { Request, Response } from "express";
import { Roles, StatusReembolso } from "../constants/enums";
import { AppError } from "../errors/app-error";
import { prisma } from "../lib/prisma";

export class ReembolsosController {
  async index(request: Request, response: Response) {
    const user = request.user;

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    const solicitacoes = await prisma.solicitacaoReembolso.findMany({
      where: this.getListWhereByRole(user.id, user.perfil),
      include: {
        categoria: true,
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true
          }
        }
      },
      orderBy: {
        criadoEm: "desc"
      }
    });

    return response.status(200).json(solicitacoes);
  }

  async create(request: Request, response: Response) {
    const user = request.user;

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    if (user.perfil !== Roles.COLABORADOR) {
      throw new AppError("Apenas colaboradores podem criar solicitacoes", 403, "Forbidden");
    }

    const { categoriaId, descricao, valor, dataDespesa } = request.body;

    const category = await prisma.category.findUnique({
      where: { id: categoriaId }
    });

    if (!category || !category.ativo) {
      throw new AppError("Categoria nao encontrada ou inativa");
    }

    const solicitacaoCriada = await prisma.$transaction(async (transaction) => {
      const solicitacao = await transaction.solicitacaoReembolso.create({
        data: {
          solicitanteId: user.id,
          categoriaId,
          descricao,
          valor,
          dataDespesa: dayjs(dataDespesa).toDate()
        },
        include: {
          categoria: true
        }
      });

      await transaction.requestHistory.create({
        data: {
          solicitacaoId: solicitacao.id,
          usuarioId: user.id,
          acao: "CREATED",
          observacao: "Solicitacao de reembolso criada"
        }
      });

      return solicitacao;
    });

    return response.status(201).json(solicitacaoCriada);
  }

  async show(request: Request, response: Response) {
    const user = request.user;
    const id = String(request.params.id);

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    const solicitacao = await prisma.solicitacaoReembolso.findUnique({
      where: { id },
      include: {
        anexos: true,
        categoria: true,
        historicos: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                perfil: true
              }
            }
          },
          orderBy: {
            criadoEm: "asc"
          }
        },
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true
          }
        }
      }
    });

    if (!solicitacao) {
      throw new AppError("Solicitacao nao encontrada", 404, "Not Found");
    }

    if (
      user.perfil === Roles.COLABORADOR &&
      solicitacao.solicitanteId !== user.id
    ) {
      throw new AppError("Usuario sem permissao", 403, "Forbidden");
    }

    return response.status(200).json(solicitacao);
  }

  private getListWhereByRole(userId: string, role: string) {
    if (role === Roles.ADMIN) {
      return undefined;
    }

    if (role === Roles.COLABORADOR) {
      return {
        solicitanteId: userId
      };
    }

    if (role === Roles.GESTOR) {
      return {
        status: StatusReembolso.ENVIADO
      };
    }

    if (role === Roles.FINANCEIRO) {
      return {
        status: StatusReembolso.APROVADO
      };
    }

    return {
      id: ""
    };
  }
}
