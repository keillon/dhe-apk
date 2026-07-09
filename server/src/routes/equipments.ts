import { Router } from "express";
import { prisma } from "../lib/prisma";
import { mapEquipment } from "../lib/mappers";
import { authMiddleware } from "../middleware/auth";

export const equipmentsRouter = Router();

equipmentsRouter.use(authMiddleware);

equipmentsRouter.get("/", async (_req, res) => {
  const equipments = await prisma.equipamento.findMany({
    include: { cliente: true },
    orderBy: { nome: "asc" },
  });

  res.json(equipments.map(mapEquipment));
});

equipmentsRouter.get("/qr/:qrCode", async (req, res) => {
  const equipment = await prisma.equipamento.findUnique({
    where: { qrCode: req.params.qrCode },
    include: { cliente: true },
  });

  if (!equipment) {
    res.status(404).json({ error: "Equipamento não encontrado" });
    return;
  }

  res.json(mapEquipment(equipment));
});

equipmentsRouter.get("/:id", async (req, res) => {
  const equipment = await prisma.equipamento.findUnique({
    where: { id: req.params.id },
    include: { cliente: true },
  });

  if (!equipment) {
    res.status(404).json({ error: "Equipamento não encontrado" });
    return;
  }

  res.json(mapEquipment(equipment));
});
