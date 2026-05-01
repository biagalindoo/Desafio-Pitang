import { Router } from "express";
import { UsersController } from "../controllers/users.controller";
import { Roles } from "../constants/enums";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { createUserSchema } from "../schemas/user.schemas";
import { asyncHandler } from "../utils/async-handler";

export const usersRoutes = Router();

const usersController = new UsersController();

usersRoutes.post(
  "/",
  validate({ body: createUserSchema }),
  asyncHandler(usersController.create)
);
usersRoutes.get(
  "/",
  authenticate,
  authorize([Roles.ADMIN]),
  asyncHandler(usersController.index)
);
