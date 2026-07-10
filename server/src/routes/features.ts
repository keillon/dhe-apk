import { Router } from "express";
import { prisma } from "../lib/prisma";
import { mapEquipment } from "../lib/mappers";
import { authMiddleware } from "../middleware/auth";

export const auditRouter = Router();

auditRouter.use(authMiddleware);

auditRouter.get("/:entidade/:id", async (req, res) => {
  const entidade = String(req.params.entidade);
  const entidadeId = String(req.params.id);

  if (entidade !== "equipamento" && entidade !== "cliente") {
    res.status(400).json({ error: "Entidade inválida" });
    return;
  }

  const logs = await prisma.auditLog.findMany({
    where: { entidade, entidadeId },
    include: { usuario: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  res.json(
    logs.map((log) => ({
      id: log.id,
      entidade: log.entidade,
      entidade_id: log.entidadeId,
      acao: log.acao,
      antes: log.antes,
      depois: log.depois,
      created_at: log.createdAt.toISOString(),
      usuario: {
        id: log.usuario.id,
        nome: log.usuario.nome,
        email: log.usuario.email,
      },
    }))
  );
});

export const maintenanceRouter = Router();

maintenanceRouter.use(authMiddleware);

maintenanceRouter.get("/calendar", async (req, res) => {
  const from = typeof req.query.from === "string" ? new Date(req.query.from) : new Date();
  const toRaw = typeof req.query.to === "string" ? new Date(req.query.to) : new Date();
  const to = new Date(toRaw.getTime() + 60 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    res.status(400).json({ error: "Período inválido" });
    return;
  }

  const equipments = await prisma.equipamento.findMany({
    where: {
      proximaManutencao: {
        gte: from,
        lte: to,
      },
    },
    include: { cliente: true },
    orderBy: { proximaManutencao: "asc" },
  });

  res.json(
    equipments.map((equipment) => ({
      id: equipment.id,
      data: equipment.proximaManutencao?.toISOString(),
      equipamento: mapEquipment(equipment),
      atrasada: equipment.proximaManutencao ? equipment.proximaManutencao < new Date() : false,
    }))
  );
});
