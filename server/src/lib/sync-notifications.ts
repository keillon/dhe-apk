import type { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

interface EnsureNotificationInput {
  usuarioId: string;
  equipamentoId: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
}

async function ensureNotification(input: EnsureNotificationInput): Promise<void> {
  const existing = await prisma.notificacao.findFirst({
    where: {
      usuarioId: input.usuarioId,
      equipamentoId: input.equipamentoId,
      tipo: input.tipo,
      lida: false,
    },
  });

  if (existing) {
    if (existing.mensagem !== input.mensagem || existing.titulo !== input.titulo) {
      await prisma.notificacao.update({
        where: { id: existing.id },
        data: {
          titulo: input.titulo,
          mensagem: input.mensagem,
        },
      });
    }
    return;
  }

  await prisma.notificacao.create({ data: input });
}

export async function syncNotificationsForUser(userId: string): Promise<void> {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const overdueEquipments = await prisma.equipamento.findMany({
    where: { proximaManutencao: { lt: now } },
  });

  for (const equipment of overdueEquipments) {
    await ensureNotification({
      usuarioId: userId,
      equipamentoId: equipment.id,
      tipo: "manutencao_vencida",
      titulo: "Manutenção vencida",
      mensagem: `${equipment.nome} (${equipment.qrCode}) está com manutenção atrasada.`,
    });
  }

  const staleEquipments = await prisma.equipamento.findMany({
    where: {
      OR: [{ ultimaInspecao: null }, { ultimaInspecao: { lt: thirtyDaysAgo } }],
    },
  });

  for (const equipment of staleEquipments) {
    await ensureNotification({
      usuarioId: userId,
      equipamentoId: equipment.id,
      tipo: "inspecao_pendente",
      titulo: "Inspeção pendente",
      mensagem: `${equipment.nome} (${equipment.qrCode}) está sem inspeção recente.`,
    });
  }

  const contaminatedInspections = await prisma.inspecao.findMany({
    where: {
      contaminacaoOleo: "alta",
      createdAt: { gte: sevenDaysAgo },
    },
    include: { equipamento: true },
    orderBy: { createdAt: "desc" },
  });

  const seenEquipmentIds = new Set<string>();
  for (const inspection of contaminatedInspections) {
    if (seenEquipmentIds.has(inspection.equipamentoId)) continue;
    seenEquipmentIds.add(inspection.equipamentoId);

    await ensureNotification({
      usuarioId: userId,
      equipamentoId: inspection.equipamentoId,
      tipo: "oleo_contaminado",
      titulo: "Óleo contaminado",
      mensagem: `${inspection.equipamento.nome} (${inspection.equipamento.qrCode}) com contaminação alta na última inspeção.`,
    });
  }
}
