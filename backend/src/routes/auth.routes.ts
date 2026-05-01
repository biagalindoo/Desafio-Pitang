import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { loginSchema } from "../schemas/auth.schemas";
import { asyncHandler } from "../utils/async-handler";

export const authRoutes = Router();

const authController = new AuthController();

authRoutes.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);
