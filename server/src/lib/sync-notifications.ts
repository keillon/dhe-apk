import type { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";
import { sendExpoPushMessages } from "./expo-push";

interface EnsureNotificationInput {
  usuarioId: string;
  equipamentoId: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
}

function alertKey(equipamentoId: string, tipo: NotificationType): string {
  return `${equipamentoId}|${tipo}`;
}

async function sendPushForNotification(
  usuarioId: string,
  notificationId: string,
  equipamentoId: string,
  titulo: string,
  mensagem: string
): Promise<void> {
  const tokens = await prisma.pushToken.findMany({
    where: { usuarioId },
    select: { token: true },
  });

  if (tokens.length === 0) return;

  try {
    await sendExpoPushMessages(
      tokens.map((item) => item.token),
      titulo,
      mensagem,
      {
        notificationId,
        equipamentoId,
        url: `dhe://equipment/${equipamentoId}`,
      }
    );

    await prisma.notificacao.update({
      where: { id: notificationId },
      data: { pushSentAt: new Date() },
    });
  } catch (error) {
    console.error("Erro ao enviar push automático:", error);
  }
}

/**
 * Garante no máximo um alerta ativo por usuário+equipamento+tipo.
 * Se o usuário já marcou como lida enquanto a condição persiste, não recria nem reenvia push.
 * Quando a condição some, settleResolvedNotifications remove o registro para permitir reaviso futuro.
 */
async function ensureNotification(input: EnsureNotificationInput): Promise<void> {
  const existing = await prisma.notificacao.findFirst({
    where: {
      usuarioId: input.usuarioId,
      equipamentoId: input.equipamentoId,
      tipo: input.tipo,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    if (existing.lida) {
      return;
    }

    if (existing.mensagem !== input.mensagem || existing.titulo !== input.titulo) {
      await prisma.notificacao.update({
        where: { id: existing.id },
        data: {
          titulo: input.titulo,
          mensagem: input.mensagem,
        },
      });
    }

    if (!existing.pushSentAt) {
      await sendPushForNotification(
        input.usuarioId,
        existing.id,
        input.equipamentoId,
        input.titulo,
        input.mensagem
      );
    }
    return;
  }

  const created = await prisma.notificacao.create({ data: input });
  await sendPushForNotification(
    input.usuarioId,
    created.id,
    input.equipamentoId,
    input.titulo,
    input.mensagem
  );
}

/** Remove alertas cuja condição já não existe, liberando recriação se o problema voltar. */
async function settleResolvedNotifications(
  usuarioId: string,
  activeKeys: Set<string>
): Promise<void> {
  const rows = await prisma.notificacao.findMany({
    where: { usuarioId },
    select: { id: true, equipamentoId: true, tipo: true },
  });

  const staleIds = rows
    .filter((row) => {
      if (!row.equipamentoId) return false;
      return !activeKeys.has(alertKey(row.equipamentoId, row.tipo));
    })
    .map((row) => row.id);

  if (staleIds.length === 0) return;

  await prisma.notificacao.deleteMany({
    where: { id: { in: staleIds } },
  });
}

/** Mantém apenas a notificação mais recente por equipamento+tipo. */
async function dedupeNotifications(usuarioId: string): Promise<void> {
  const rows = await prisma.notificacao.findMany({
    where: { usuarioId },
    orderBy: { createdAt: "desc" },
    select: { id: true, equipamentoId: true, tipo: true },
  });

  const seen = new Set<string>();
  const duplicateIds: string[] = [];

  for (const row of rows) {
    if (!row.equipamentoId) continue;
    const key = alertKey(row.equipamentoId, row.tipo);
    if (seen.has(key)) {
      duplicateIds.push(row.id);
      continue;
    }
    seen.add(key);
  }

  if (duplicateIds.length === 0) return;

  await prisma.notificacao.deleteMany({
    where: { id: { in: duplicateIds } },
  });
}

export async function syncNotificationsForUser(userId: string): Promise<void> {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return;

  await dedupeNotifications(userId);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const activeKeys = new Set<string>();

  const overdueEquipments = await prisma.equipamento.findMany({
    where: { proximaManutencao: { lt: now } },
  });

  for (const equipment of overdueEquipments) {
    activeKeys.add(alertKey(equipment.id, "manutencao_vencida"));
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
    activeKeys.add(alertKey(equipment.id, "inspecao_pendente"));
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

    activeKeys.add(alertKey(inspection.equipamentoId, "oleo_contaminado"));
    await ensureNotification({
      usuarioId: userId,
      equipamentoId: inspection.equipamentoId,
      tipo: "oleo_contaminado",
      titulo: "Óleo contaminado",
      mensagem: `${inspection.equipamento.nome} (${inspection.equipamento.qrCode}) com contaminação alta na última inspeção.`,
    });
  }

  await settleResolvedNotifications(userId, activeKeys);
}
