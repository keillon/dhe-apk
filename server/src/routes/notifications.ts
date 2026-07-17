import { Router } from "express";
import { prisma } from "../lib/prisma";
import { mapNotification } from "../lib/mappers";
import { syncNotificationsForUser } from "../lib/sync-notifications";
import { authMiddleware } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

notificationsRouter.get("/", async (req, res) => {
  try {
    await syncNotificationsForUser(req.auth!.userId);

    const notifications = await prisma.notificacao.findMany({
      where: { usuarioId: req.auth!.userId },
      orderBy: [{ lida: "asc" }, { createdAt: "desc" }],
    });

    res.json(notifications.map(mapNotification));
  } catch (error) {
    console.error("Erro ao listar notificações:", error);
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

notificationsRouter.post("/sync", async (req, res) => {
  try {
    await syncNotificationsForUser(req.auth!.userId);

    const notifications = await prisma.notificacao.findMany({
      where: { usuarioId: req.auth!.userId },
      orderBy: [{ lida: "asc" }, { createdAt: "desc" }],
    });

    res.json(notifications.map(mapNotification));
  } catch (error) {
    console.error("Erro ao sincronizar notificações:", error);
    res.status(500).json({ error: "Erro ao sincronizar notificações" });
  }
});

notificationsRouter.patch("/read-all", async (req, res) => {
  try {
    await prisma.notificacao.updateMany({
      where: { usuarioId: req.auth!.userId, lida: false },
      data: { lida: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
    res.status(500).json({ error: "Erro ao marcar notificações como lidas" });
  }
});

notificationsRouter.patch("/:id/read", async (req, res) => {
  try {
    const notification = await prisma.notificacao.updateMany({
      where: {
        id: req.params.id,
        usuarioId: req.auth!.userId,
      },
      data: { lida: true },
    });

    if (notification.count === 0) {
      res.status(404).json({ error: "Notificação não encontrada" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    res.status(500).json({ error: "Erro ao marcar notificação como lida" });
  }
});
