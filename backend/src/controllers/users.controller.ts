import { hash } from "bcryptjs";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/app-error";

export class UsersController {
  async create(request: Request, response: Response) {
    const { nome, email, senha, perfil } = request.body;

    const userAlreadyExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userAlreadyExists) {
      throw new AppError("E-mail ja cadastrado");
    }

    const passwordHash = await hash(senha, 8);

    const user = await prisma.user.create({
      data: {
        nome,
        email,
        senha: passwordHash,
        perfil
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        criadoEm: true,
        atualizadoEm: true
      }
    });

    return response.status(201).json(user);
  }

  async index(_request: Request, response: Response) {
    const users = await prisma.user.findMany({
      orderBy: {
        nome: "asc"
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        criadoEm: true,
        atualizadoEm: true
      }
    });

    return response.status(200).json(users);
  }
}

