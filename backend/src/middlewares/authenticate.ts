import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { AppError } from "../errors/app-error";
import { Role } from "../constants/enums";

type JwtPayload = {
  sub: string;
  perfil: Role;
};

export function authenticate(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token nao informado", 401, "Unauthorized");
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    throw new AppError("Token invalido", 401, "Unauthorized");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new AppError("JWT_SECRET nao configurado", 500, "Internal Server Error");
  }

  try {
    const decoded = verify(token, jwtSecret) as JwtPayload;

    // Deixa o id e o perfil disponiveis para controllers e permissoes
    request.user = {
      id: decoded.sub,
      perfil: decoded.perfil
    };

    return next();
  } catch {
    throw new AppError("Token invalido ou expirado", 401, "Unauthorized");
  }
}
