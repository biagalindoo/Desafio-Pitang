import { z } from "zod";

export const reembolsoParamsSchema = z.object({
  id: z.string().min(1, "Id da solicitacao obrigatorio")
});

export const createReembolsoSchema = z.object({
  categoriaId: z.string().min(1, "Categoria obrigatoria"),
  descricao: z.string().trim().min(3, "Descricao obrigatoria"),
  valor: z.coerce.number().positive("Valor deve ser maior que zero"),
  dataDespesa: z.coerce.date({
    required_error: "Data da despesa obrigatoria",
    invalid_type_error: "Data da despesa invalida"
  })
});

export const updateReembolsoSchema = z
  .object({
    categoriaId: z.string().min(1, "Categoria obrigatoria").optional(),
    descricao: z.string().trim().min(3, "Descricao obrigatoria").optional(),
    valor: z.coerce.number().positive("Valor deve ser maior que zero").optional(),
    dataDespesa: z.coerce
      .date({
        invalid_type_error: "Data da despesa invalida"
      })
      .optional()
  })
  .refine(
    (data) =>
      data.categoriaId !== undefined ||
      data.descricao !== undefined ||
      data.valor !== undefined ||
      data.dataDespesa !== undefined,
    {
      message: "Informe ao menos um campo para atualizar"
    }
  );
