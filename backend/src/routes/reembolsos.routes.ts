import { Router } from "express";
import { ReembolsosController } from "../controllers/reembolsos.controller";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import {
  createReembolsoSchema,
  reembolsoParamsSchema,
  rejectReembolsoSchema,
  updateReembolsoSchema
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
reembolsosRoutes.put(
  "/:id",
  validate({ params: reembolsoParamsSchema, body: updateReembolsoSchema }),
  asyncHandler(reembolsosController.update)
);
reembolsosRoutes.post(
  "/:id/cancelar",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.cancel)
);
reembolsosRoutes.post(
  "/:id/enviar",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.submit)
);
reembolsosRoutes.post(
  "/:id/aprovar",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.approve)
);
reembolsosRoutes.post(
  "/:id/rejeitar",
  validate({ params: reembolsoParamsSchema, body: rejectReembolsoSchema }),
  asyncHandler(reembolsosController.reject)
);
reembolsosRoutes.get(
  "/:id",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.show)
);
