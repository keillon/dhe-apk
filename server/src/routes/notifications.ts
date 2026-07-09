import { Router } from "express";
import { prisma } from "../lib/prisma";
import { mapNotification } from "../lib/mappers";
import { authMiddleware } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

notificationsRouter.get("/", async (req, res) => {
  const notifications = await prisma.notificacao.findMany({
    where: { usuarioId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
  });

  res.json(notifications.map(mapNotification));
});

notificationsRouter.patch("/:id/read", async (req, res) => {
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
});
