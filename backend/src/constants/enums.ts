export const Roles = {
  ADMIN: "ADMIN",
  COLABORADOR: "COLABORADOR",
  GESTOR: "GESTOR",
  FINANCEIRO: "FINANCEIRO"
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const ReimbursementStatuses = {
  RASCUNHO: "RASCUNHO",
  ENVIADO: "ENVIADO",
  APROVADO: "APROVADO",
  REJEITADO: "REJEITADO",
  PAGO: "PAGO",
  CANCELADO: "CANCELADO"
} as const;

export type ReimbursementStatus =
  (typeof ReimbursementStatuses)[keyof typeof ReimbursementStatuses];

export const HistoryActions = {
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PAID: "PAID",
  CANCELED: "CANCELED"
} as const;

export type HistoryAction = (typeof HistoryActions)[keyof typeof HistoryActions];

