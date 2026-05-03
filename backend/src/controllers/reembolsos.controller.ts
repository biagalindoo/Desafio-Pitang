import dayjs from "dayjs";
import { Prisma } from "@prisma/client";
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

    const where = this.buildListWhere({
      categoriaId: String(request.query.categoriaId || ""),
      role: user.perfil,
      status: String(request.query.status || ""),
      userId: user.id
    });

    const solicitacoes = await prisma.solicitacaoReembolso.findMany({
      where,
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

  async update(request: Request, response: Response) {
    const user = request.user;
    const id = String(request.params.id);

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    if (user.perfil !== Roles.COLABORADOR) {
      throw new AppError("Apenas colaboradores podem editar solicitacoes", 403, "Forbidden");
    }

    const solicitacao = await prisma.solicitacaoReembolso.findUnique({
      where: { id }
    });

    if (!solicitacao) {
      throw new AppError("Solicitacao nao encontrada", 404, "Not Found");
    }

    if (solicitacao.solicitanteId !== user.id) {
      throw new AppError("Usuario sem permissao", 403, "Forbidden");
    }

    if (solicitacao.status !== StatusReembolso.RASCUNHO) {
      throw new AppError("Apenas solicitacoes em rascunho podem ser editadas");
    }

    const { categoriaId, descricao, valor, dataDespesa } = request.body;

    if (categoriaId) {
      const category = await prisma.category.findUnique({
        where: { id: categoriaId }
      });

      if (!category || !category.ativo) {
        throw new AppError("Categoria nao encontrada ou inativa");
      }
    }

    const solicitacaoAtualizada = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.solicitacaoReembolso.update({
        where: { id },
        data: {
          categoriaId,
          descricao,
          valor,
          dataDespesa: dataDespesa ? dayjs(dataDespesa).toDate() : undefined
        },
        include: {
          categoria: true
        }
      });

      await transaction.requestHistory.create({
        data: {
          solicitacaoId: id,
          usuarioId: user.id,
          acao: "UPDATED",
          observacao: "Solicitacao de reembolso atualizada"
        }
      });

      return updated;
    });

    return response.status(200).json(solicitacaoAtualizada);
  }

  async cancel(request: Request, response: Response) {
    const user = request.user;
    const id = String(request.params.id);

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    if (user.perfil !== Roles.COLABORADOR) {
      throw new AppError("Apenas colaboradores podem cancelar solicitacoes", 403, "Forbidden");
    }

    const solicitacao = await prisma.solicitacaoReembolso.findUnique({
      where: { id }
    });

    if (!solicitacao) {
      throw new AppError("Solicitacao nao encontrada", 404, "Not Found");
    }

    if (solicitacao.solicitanteId !== user.id) {
      throw new AppError("Usuario sem permissao", 403, "Forbidden");
    }

    if (solicitacao.status !== StatusReembolso.RASCUNHO) {
      throw new AppError("Apenas solicitacoes em rascunho podem ser canceladas");
    }

    const solicitacaoCancelada = await prisma.$transaction(async (transaction) => {
      const canceled = await transaction.solicitacaoReembolso.update({
        where: { id },
        data: {
          status: StatusReembolso.CANCELADO
        },
        include: {
          categoria: true
        }
      });

      await transaction.requestHistory.create({
        data: {
          solicitacaoId: id,
          usuarioId: user.id,
          acao: "CANCELED",
          observacao: "Solicitacao de reembolso cancelada"
        }
      });

      return canceled;
    });

    return response.status(200).json(solicitacaoCancelada);
  }

  async submit(request: Request, response: Response) {
    const user = request.user;
    const id = String(request.params.id);

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    if (user.perfil !== Roles.COLABORADOR) {
      throw new AppError("Apenas colaboradores podem enviar solicitacoes", 403, "Forbidden");
    }

    const solicitacao = await prisma.solicitacaoReembolso.findUnique({
      where: { id }
    });

    if (!solicitacao) {
      throw new AppError("Solicitacao nao encontrada", 404, "Not Found");
    }

    if (solicitacao.solicitanteId !== user.id) {
      throw new AppError("Usuario sem permissao", 403, "Forbidden");
    }

    if (solicitacao.status !== StatusReembolso.RASCUNHO) {
      throw new AppError("Apenas solicitacoes em rascunho podem ser enviadas");
    }

    const solicitacaoEnviada = await prisma.$transaction(async (transaction) => {
      const submitted = await transaction.solicitacaoReembolso.update({
        where: { id },
        data: {
          status: StatusReembolso.ENVIADO
        },
        include: {
          categoria: true
        }
      });

      await transaction.requestHistory.create({
        data: {
          solicitacaoId: id,
          usuarioId: user.id,
          acao: "SUBMITTED",
          observacao: "Solicitacao enviada para analise"
        }
      });

      return submitted;
    });

    return response.status(200).json(solicitacaoEnviada);
  }

  async approve(request: Request, response: Response) {
    const user = request.user;
    const id = String(request.params.id);

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    if (user.perfil !== Roles.GESTOR) {
      throw new AppError("Apenas gestores podem aprovar solicitacoes", 403, "Forbidden");
    }

    const solicitacao = await prisma.solicitacaoReembolso.findUnique({
      where: { id }
    });

    if (!solicitacao) {
      throw new AppError("Solicitacao nao encontrada", 404, "Not Found");
    }

    if (solicitacao.status !== StatusReembolso.ENVIADO) {
      throw new AppError("Apenas solicitacoes enviadas podem ser aprovadas");
    }

    const solicitacaoAprovada = await prisma.$transaction(async (transaction) => {
      const approved = await transaction.solicitacaoReembolso.update({
        where: { id },
        data: {
          status: StatusReembolso.APROVADO,
          justificativaRejeicao: null
        },
        include: {
          categoria: true
        }
      });

      await transaction.requestHistory.create({
        data: {
          solicitacaoId: id,
          usuarioId: user.id,
          acao: "APPROVED",
          observacao: "Solicitacao aprovada pelo gestor"
        }
      });

      return approved;
    });

    return response.status(200).json(solicitacaoAprovada);
  }

  async reject(request: Request, response: Response) {
    const user = request.user;
    const id = String(request.params.id);
    const { justificativaRejeicao } = request.body;

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    if (user.perfil !== Roles.GESTOR) {
      throw new AppError("Apenas gestores podem rejeitar solicitacoes", 403, "Forbidden");
    }

    const solicitacao = await prisma.solicitacaoReembolso.findUnique({
      where: { id }
    });

    if (!solicitacao) {
      throw new AppError("Solicitacao nao encontrada", 404, "Not Found");
    }

    if (solicitacao.status !== StatusReembolso.ENVIADO) {
      throw new AppError("Apenas solicitacoes enviadas podem ser rejeitadas");
    }

    const solicitacaoRejeitada = await prisma.$transaction(async (transaction) => {
      const rejected = await transaction.solicitacaoReembolso.update({
        where: { id },
        data: {
          status: StatusReembolso.REJEITADO,
          justificativaRejeicao
        },
        include: {
          categoria: true
        }
      });

      await transaction.requestHistory.create({
        data: {
          solicitacaoId: id,
          usuarioId: user.id,
          acao: "REJECTED",
          observacao: justificativaRejeicao
        }
      });

      return rejected;
    });

    return response.status(200).json(solicitacaoRejeitada);
  }

  async pay(request: Request, response: Response) {
    const user = request.user;
    const id = String(request.params.id);

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    if (user.perfil !== Roles.FINANCEIRO) {
      throw new AppError("Apenas o financeiro pode marcar solicitacoes como pagas", 403, "Forbidden");
    }

    const solicitacao = await prisma.solicitacaoReembolso.findUnique({
      where: { id }
    });

    if (!solicitacao) {
      throw new AppError("Solicitacao nao encontrada", 404, "Not Found");
    }

    if (solicitacao.status !== StatusReembolso.APROVADO) {
      throw new AppError("Apenas solicitacoes aprovadas podem ser pagas");
    }

    const solicitacaoPaga = await prisma.$transaction(async (transaction) => {
      const paid = await transaction.solicitacaoReembolso.update({
        where: { id },
        data: {
          status: StatusReembolso.PAGO
        },
        include: {
          categoria: true
        }
      });

      await transaction.requestHistory.create({
        data: {
          solicitacaoId: id,
          usuarioId: user.id,
          acao: "PAID",
          observacao: "Pagamento realizado pelo financeiro"
        }
      });

      return paid;
    });

    return response.status(200).json(solicitacaoPaga);
  }

  async history(request: Request, response: Response) {
    const user = request.user;
    const id = String(request.params.id);

    if (!user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    const solicitacao = await prisma.solicitacaoReembolso.findUnique({
      where: { id },
      select: {
        id: true,
        solicitanteId: true
      }
    });

    if (!solicitacao) {
      throw new AppError("Solicitacao nao encontrada", 404, "Not Found");
    }

    if (user.perfil === Roles.COLABORADOR && solicitacao.solicitanteId !== user.id) {
      throw new AppError("Usuario sem permissao", 403, "Forbidden");
    }

    const historico = await prisma.requestHistory.findMany({
      where: {
        solicitacaoId: id
      },
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
    });

    return response.status(200).json(historico);
  }

  private buildListWhere({
    categoriaId,
    role,
    status,
    userId
  }: {
    categoriaId: string;
    role: string;
    status: string;
    userId: string;
  }) {
    const filters: Prisma.SolicitacaoReembolsoWhereInput[] = [];
    const roleWhere = this.getListWhereByRole(userId, role);

    if (roleWhere) {
      filters.push(roleWhere);
    }

    if (status) {
      filters.push({ status });
    }

    if (categoriaId) {
      filters.push({ categoriaId });
    }

    if (filters.length === 0) {
      return undefined;
    }

    return {
      AND: filters
    };
  }

  private getListWhereByRole(
    userId: string,
    role: string
  ): Prisma.SolicitacaoReembolsoWhereInput | undefined {
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
