import { NextFunction, Request, Response } from "express";
import { Role } from "../constants/enums";
import { AppError } from "../errors/app-error";

export function authorize(allowedRoles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      throw new AppError("Usuario nao autenticado", 401, "Unauthorized");
    }

    // Aqui fica a checagem de RBAC: cada rota informa quais perfis aceita
    if (!allowedRoles.includes(request.user.perfil)) {
      throw new AppError("Usuario sem permissao", 403, "Forbidden");
    }

    return next();
  };
}
