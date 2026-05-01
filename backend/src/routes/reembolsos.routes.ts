import { Router } from "express";
import { AnexosController } from "../controllers/anexos.controller";
import { ReembolsosController } from "../controllers/reembolsos.controller";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import {
  createReembolsoSchema,
  reembolsoParamsSchema,
  rejectReembolsoSchema,
  updateReembolsoSchema
} from "../schemas/reembolso.schemas";
import { createAnexoSchema } from "../schemas/anexo.schemas";
import { asyncHandler } from "../utils/async-handler";

export const reembolsosRoutes = Router();

const anexosController = new AnexosController();
const reembolsosController = new ReembolsosController();

reembolsosRoutes.use(authenticate);

reembolsosRoutes.get("/", asyncHandler(reembolsosController.index.bind(reembolsosController)));
reembolsosRoutes.post(
  "/",
  validate({ body: createReembolsoSchema }),
  asyncHandler(reembolsosController.create.bind(reembolsosController))
);
reembolsosRoutes.put(
  "/:id",
  validate({ params: reembolsoParamsSchema, body: updateReembolsoSchema }),
  asyncHandler(reembolsosController.update.bind(reembolsosController))
);
reembolsosRoutes.post(
  "/:id/cancelar",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.cancel.bind(reembolsosController))
);
reembolsosRoutes.post(
  "/:id/enviar",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.submit.bind(reembolsosController))
);
reembolsosRoutes.post(
  "/:id/aprovar",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.approve.bind(reembolsosController))
);
reembolsosRoutes.post(
  "/:id/rejeitar",
  validate({ params: reembolsoParamsSchema, body: rejectReembolsoSchema }),
  asyncHandler(reembolsosController.reject.bind(reembolsosController))
);
reembolsosRoutes.post(
  "/:id/pagar",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.pay.bind(reembolsosController))
);
reembolsosRoutes.get(
  "/:id/historico",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.history.bind(reembolsosController))
);
reembolsosRoutes.get(
  "/:id/anexos",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(anexosController.index.bind(anexosController))
);
reembolsosRoutes.post(
  "/:id/anexos",
  validate({ params: reembolsoParamsSchema, body: createAnexoSchema }),
  asyncHandler(anexosController.create.bind(anexosController))
);
reembolsosRoutes.get(
  "/:id",
  validate({ params: reembolsoParamsSchema }),
  asyncHandler(reembolsosController.show.bind(reembolsosController))
);
