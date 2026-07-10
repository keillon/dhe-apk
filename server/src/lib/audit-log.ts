import type { AuditEntity, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

interface AuditLogInput {
  entidade: AuditEntity;
  entidadeId: string;
  usuarioId: string;
  acao: "create" | "update" | "delete";
  antes?: Record<string, unknown> | null;
  depois?: Record<string, unknown> | null;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entidade: input.entidade,
      entidadeId: input.entidadeId,
      usuarioId: input.usuarioId,
      acao: input.acao,
      antes: (input.antes ?? undefined) as Prisma.InputJsonValue | undefined,
      depois: (input.depois ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export function pickAuditFields<T extends Record<string, unknown>>(
  entity: T,
  fields: (keyof T)[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    result[String(field)] = entity[field];
  }
  return result;
}
