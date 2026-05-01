import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
      statusCode: error.statusCode,
      error: error.error
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Erro de validacao",
      statusCode: 400,
      error: "Bad Request",
      issues: error.flatten().fieldErrors
    });
  }

  return response.status(500).json({
    message: "Erro interno do servidor",
    statusCode: 500,
    error: "Internal Server Error"
  });
}

