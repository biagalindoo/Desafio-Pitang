import { z } from "zod";

const tiposPermitidos = ["application/pdf", "image/jpeg", "image/png"] as const;

export const createAnexoSchema = z.object({
  nomeArquivo: z.string().trim().min(1, "Nome do arquivo obrigatorio"),
  urlArquivo: z.string().trim().min(1, "URL do arquivo obrigatoria"),
  tipoArquivo: z.enum(tiposPermitidos, {
    errorMap: () => ({
      message: "Tipo de arquivo permitido: PDF, JPG ou PNG"
    })
  })
});

