import { compare } from "bcryptjs";
import { Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/app-error";

export class AuthController {
  async login(request: Request, response: Response) {
    const { email, senha } = request.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AppError("Credenciais invalidas", 401, "Unauthorized");
    }

    const passwordMatches = await compare(senha, user.senha);

    if (!passwordMatches) {
      throw new AppError("Credenciais invalidas", 401, "Unauthorized");
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new AppError("JWT_SECRET nao configurado", 500, "Internal Server Error");
    }

    const token = sign(
      {
        perfil: user.perfil
      },
      jwtSecret,
      {
        subject: user.id,
        expiresIn: "1d"
      }
    );

    return response.status(200).json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil
      }
    });
  }
}

