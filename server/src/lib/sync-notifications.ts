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
 * Nunca reinicia `lida` para false — se o técnico já leu, permanece lida
 * enquanto a condição existir.
 */
async function ensureNotification(input: EnsureNotificationInput): Promise<void> {
  const existing = await prisma.notificacao.findUnique({
    where: {
      usuarioId_equipamentoId_tipo: {
        usuarioId: input.usuarioId,
        equipamentoId: input.equipamentoId,
        tipo: input.tipo,
      },
    },
  });

  if (existing) {
    const needsContentUpdate =
      existing.mensagem !== input.mensagem || existing.titulo !== input.titulo;

    if (needsContentUpdate) {
      await prisma.notificacao.update({
        where: { id: existing.id },
        data: {
          titulo: input.titulo,
          mensagem: input.mensagem,
        },
      });
    }

    // Já lida: não reenvia push nem reabre o alerta.
    if (existing.lida) return;

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

  try {
    const created = await prisma.notificacao.create({ data: input });
    await sendPushForNotification(
      input.usuarioId,
      created.id,
      input.equipamentoId,
      input.titulo,
      input.mensagem
    );
  } catch (error) {
    // Corrida: outro request criou o mesmo alerta — não falha o sync.
    const raced = await prisma.notificacao.findUnique({
      where: {
        usuarioId_equipamentoId_tipo: {
          usuarioId: input.usuarioId,
          equipamentoId: input.equipamentoId,
          tipo: input.tipo,
        },
      },
    });
    if (!raced) throw error;
  }
}

/** Remove apenas alertas cuja condição já não existe (libera reaviso futuro). */
async function settleResolvedNotifications(
  usuarioId: string,
  activeKeys: Set<string>
): Promise<void> {
  const rows = await prisma.notificacao.findMany({
    where: { usuarioId, equipamentoId: { not: null } },
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

export async function syncNotificationsForUser(userId: string): Promise<void> {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return;

  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const activeKeys = new Set<string>();

  const overdueEquipments = await prisma.equipamento.findMany({
    where: { proximaManutencao: { lt: new Date(now) } },
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
