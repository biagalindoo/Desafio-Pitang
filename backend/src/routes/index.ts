import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { categoriesRoutes } from "./categories.routes";
import { healthRoutes } from "./health.routes";
import { usersRoutes } from "./users.routes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/categories", categoriesRoutes);
routes.use("/health", healthRoutes);
routes.use("/users", usersRoutes);
