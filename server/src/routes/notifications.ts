import { Router } from "express";
import { prisma } from "../lib/prisma";
import { mapNotification } from "../lib/mappers";
import { syncNotificationsForUser } from "../lib/sync-notifications";
import { authMiddleware } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

async function listForUser(userId: string) {
  const notifications = await prisma.notificacao.findMany({
    where: { usuarioId: userId },
    orderBy: [{ lida: "asc" }, { createdAt: "desc" }],
  });
  return notifications.map(mapNotification);
}

notificationsRouter.get("/", async (req, res) => {
  try {
    const skipSync = req.query.skipSync === "1" || req.query.skipSync === "true";
    if (!skipSync) {
      await syncNotificationsForUser(req.auth!.userId);
    }

    res.json(await listForUser(req.auth!.userId));
  } catch (error) {
    console.error("Erro ao listar notificações:", error);
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

notificationsRouter.post("/sync", async (req, res) => {
  try {
    await syncNotificationsForUser(req.auth!.userId);
    res.json(await listForUser(req.auth!.userId));
  } catch (error) {
    console.error("Erro ao sincronizar notificações:", error);
    res.status(500).json({ error: "Erro ao sincronizar notificações" });
  }
});

notificationsRouter.patch("/read-all", async (req, res) => {
  try {
    const result = await prisma.notificacao.updateMany({
      where: { usuarioId: req.auth!.userId, lida: false },
      data: { lida: true },
    });

    res.json({
      success: true,
      updated: result.count,
      notifications: await listForUser(req.auth!.userId),
    });
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
    res.status(500).json({ error: "Erro ao marcar notificações como lidas" });
  }
});

notificationsRouter.patch("/:id/read", async (req, res) => {
  try {
    const notificationId = String(req.params.id);

    const updated = await prisma.notificacao.updateMany({
      where: {
        id: notificationId,
        usuarioId: req.auth!.userId,
      },
      data: { lida: true },
    });

    if (updated.count === 0) {
      res.status(404).json({ error: "Notificação não encontrada" });
      return;
    }

    const notification = await prisma.notificacao.findFirst({
      where: { id: notificationId, usuarioId: req.auth!.userId },
    });

    res.json({
      success: true,
      notification: notification ? mapNotification(notification) : null,
      notifications: await listForUser(req.auth!.userId),
    });
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    res.status(500).json({ error: "Erro ao marcar notificação como lida" });
  }
});
