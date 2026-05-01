import { Router } from "express";

export const healthRoutes = Router();

healthRoutes.get("/", (_request, response) => {
  return response.status(200).json({
    status: "ok"
  });
});

