import { Request, Response } from "express";
import { Roles } from "../constants/enums";
import { AppError } from "../errors/app-error";
import { prisma } from "../lib/prisma";

export class CategoriesController {
  async index(request: Request, response: Response) {
    const isAdmin = request.user?.perfil === Roles.ADMIN;

    const categories = await prisma.category.findMany({
      where: isAdmin ? undefined : { ativo: true },
      orderBy: {
        nome: "asc"
      }
    });

    return response.status(200).json(categories);
  }

  async create(request: Request, response: Response) {
    const { nome } = request.body;

    const categoryAlreadyExists = await prisma.category.findUnique({
      where: { nome }
    });

    if (categoryAlreadyExists) {
      throw new AppError("Categoria ja cadastrada");
    }

    const category = await prisma.category.create({
      data: {
        nome
      }
    });

    return response.status(201).json(category);
  }

  async update(request: Request, response: Response) {
    const id = String(request.params.id);
    const { nome, ativo } = request.body;

    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw new AppError("Categoria nao encontrada", 404, "Not Found");
    }

    if (nome && nome !== category.nome) {
      const categoryWithSameName = await prisma.category.findUnique({
        where: { nome }
      });

      if (categoryWithSameName) {
        throw new AppError("Categoria ja cadastrada");
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        nome,
        ativo
      }
    });

    return response.status(200).json(updatedCategory);
  }
}
