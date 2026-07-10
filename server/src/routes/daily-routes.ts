import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapEquipment } from "../lib/mappers";
import { authMiddleware } from "../middleware/auth";

export const dailyRoutesRouter = Router();

dailyRoutesRouter.use(authMiddleware);

function startOfDay(date = new Date()): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

async function buildSuggestedEquipmentIds(): Promise<string[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const equipments = await prisma.equipamento.findMany({
    where: {
      OR: [
        { proximaManutencao: { lte: now } },
        { ultimaInspecao: null },
        { ultimaInspecao: { lt: thirtyDaysAgo } },
        { status: { in: ["parado", "manutencao"] } },
      ],
    },
    orderBy: [{ proximaManutencao: "asc" }, { nome: "asc" }],
    take: 20,
  });

  return equipments.map((item) => item.id);
}

dailyRoutesRouter.get("/today", async (req, res) => {
  try {
    const today = startOfDay();
    const tecnicoId = req.auth!.userId;

    let route = await prisma.rotaDiaria.findUnique({
      where: {
        tecnicoId_data: {
          tecnicoId,
          data: today,
        },
      },
      include: {
        itens: {
          include: { equipamento: { include: { cliente: true } } },
          orderBy: { ordem: "asc" },
        },
      },
    });

    if (!route) {
      const equipmentIds = await buildSuggestedEquipmentIds();
      route = await prisma.rotaDiaria.create({
        data: {
          tecnicoId,
          data: today,
          status: "planejada",
          itens: {
            create: equipmentIds.map((equipamentoId, index) => ({
              equipamentoId,
              ordem: index + 1,
            })),
          },
        },
        include: {
          itens: {
            include: { equipamento: { include: { cliente: true } } },
            orderBy: { ordem: "asc" },
          },
        },
      });
    }

    res.json({
      id: route.id,
      data: route.data.toISOString().split("T")[0],
      status: route.status,
      itens: route.itens.map((item) => ({
        id: item.id,
        ordem: item.ordem,
        visitado_em: item.visitadoEm?.toISOString(),
        equipamento: mapEquipment(item.equipamento),
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar rota do dia:", error);
    res.status(500).json({ error: "Erro ao buscar rota do dia" });
  }
});

dailyRoutesRouter.patch("/items/:itemId/visit", async (req, res) => {
  try {
    const itemId = String(req.params.itemId);
    const item = await prisma.rotaItem.findUnique({
      where: { id: itemId },
      include: { rota: true },
    });

    if (!item || item.rota.tecnicoId !== req.auth!.userId) {
      res.status(404).json({ error: "Item da rota não encontrado" });
      return;
    }

    const updated = await prisma.rotaItem.update({
      where: { id: itemId },
      data: { visitadoEm: new Date() },
    });

    const pending = await prisma.rotaItem.count({
      where: { rotaId: item.rotaId, visitadoEm: null },
    });

    if (pending === 0) {
      await prisma.rotaDiaria.update({
        where: { id: item.rotaId },
        data: { status: "concluida" },
      });
    } else {
      await prisma.rotaDiaria.update({
        where: { id: item.rotaId },
        data: { status: "em_andamento" },
      });
    }

    res.json({ success: true, visitado_em: updated.visitadoEm?.toISOString() });
  } catch (error) {
    console.error("Erro ao marcar visita:", error);
    res.status(500).json({ error: "Erro ao atualizar rota" });
  }
});

dailyRoutesRouter.post("/regenerate", async (req, res) => {
  try {
    const today = startOfDay();
    const tecnicoId = req.auth!.userId;
    const equipmentIds = await buildSuggestedEquipmentIds();

    const route = await prisma.rotaDiaria.upsert({
      where: { tecnicoId_data: { tecnicoId, data: today } },
      create: {
        tecnicoId,
        data: today,
        status: "planejada",
        itens: {
          create: equipmentIds.map((equipamentoId, index) => ({
            equipamentoId,
            ordem: index + 1,
          })),
        },
      },
      update: {
        status: "planejada",
        itens: {
          deleteMany: {},
          create: equipmentIds.map((equipamentoId, index) => ({
            equipamentoId,
            ordem: index + 1,
          })),
        },
      },
      include: {
        itens: {
          include: { equipamento: { include: { cliente: true } } },
          orderBy: { ordem: "asc" },
        },
      },
    });

    res.json({
      id: route.id,
      data: route.data.toISOString().split("T")[0],
      status: route.status,
      itens: route.itens.map((item) => ({
        id: item.id,
        ordem: item.ordem,
        visitado_em: item.visitadoEm?.toISOString(),
        equipamento: mapEquipment(item.equipamento),
      })),
    });
  } catch (error) {
    console.error("Erro ao regenerar rota:", error);
    res.status(500).json({ error: "Erro ao regenerar rota" });
  }
});
