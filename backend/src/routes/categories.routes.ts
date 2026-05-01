import { Router } from "express";
import { Roles } from "../constants/enums";
import { CategoriesController } from "../controllers/categories.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import {
  categoryParamsSchema,
  createCategorySchema,
  updateCategorySchema
} from "../schemas/category.schemas";
import { asyncHandler } from "../utils/async-handler";

export const categoriesRoutes = Router();

const categoriesController = new CategoriesController();

categoriesRoutes.use(authenticate);

categoriesRoutes.get("/", asyncHandler(categoriesController.index));
categoriesRoutes.post(
  "/",
  authorize([Roles.ADMIN]),
  validate({ body: createCategorySchema }),
  asyncHandler(categoriesController.create)
);
categoriesRoutes.put(
  "/:id",
  authorize([Roles.ADMIN]),
  validate({ params: categoryParamsSchema, body: updateCategorySchema }),
  asyncHandler(categoriesController.update)
);

