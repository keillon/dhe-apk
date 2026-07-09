import { Router } from "express";
import { prisma } from "../lib/prisma";
import { mapClient } from "../lib/mappers";
import { authMiddleware } from "../middleware/auth";

export const clientsRouter = Router();

clientsRouter.use(authMiddleware);

clientsRouter.get("/", async (_req, res) => {
  const clients = await prisma.cliente.findMany({ orderBy: { nome: "asc" } });
  res.json(clients.map(mapClient));
});

clientsRouter.get("/:id", async (req, res) => {
  const client = await prisma.cliente.findUnique({ where: { id: req.params.id } });

  if (!client) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  res.json(mapClient(client));
});
