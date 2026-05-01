import { z } from "zod";
import { Roles } from "../constants/enums";

const roleValues = Object.values(Roles) as [string, ...string[]];

export const createUserSchema = z.object({
  nome: z.string().trim().min(2, "Nome obrigatorio"),
  email: z.string().trim().email("E-mail invalido").toLowerCase(),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  perfil: z.enum(roleValues)
});
