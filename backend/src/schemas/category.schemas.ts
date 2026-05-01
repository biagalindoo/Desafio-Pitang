import { z } from "zod";

export const categoryParamsSchema = z.object({
  id: z.string().min(1, "Id da categoria obrigatorio")
});

export const createCategorySchema = z.object({
  nome: z.string().trim().min(2, "Nome obrigatorio")
});

export const updateCategorySchema = z
  .object({
    nome: z.string().trim().min(2, "Nome obrigatorio").optional(),
    ativo: z.boolean().optional()
  })
  .refine((data) => data.nome !== undefined || data.ativo !== undefined, {
    message: "Informe ao menos um campo para atualizar"
  });

