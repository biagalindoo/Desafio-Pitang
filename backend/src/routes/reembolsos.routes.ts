import { Router } from "express";
import { ReembolsosController } from "../controllers/reembolsos.controller";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import {
  createReembolsoSchema,
  reembolsoParamsSchema
} from "../schemas/reembolso.schemas";
import { asyncHandler } from "../utils/async-handler";

export const reembolsosRoutes = Router();

const reembolsosController = new ReembolsosController();

reembolsosRoutes.use(authenticate);

reembolsosRoutes.get("/", asyncHandler(reembolsosController.index));
reembolsosRoutes.post(
  "/",
  validate({ body: createReembolsoSchema }),
  asyncHandler(reembolsosController.create)
);
reembolsosRoutes.get(
  "/:id",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.show)
);
