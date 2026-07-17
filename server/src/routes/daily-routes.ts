import { Router } from "express";
import { prisma } from "../lib/prisma";
import { mapEquipment } from "../lib/mappers";
import { authMiddleware } from "../middleware/auth";

export const dailyRoutesRouter = Router();

dailyRoutesRouter.use(authMiddleware);

const ROUTE_TIMEZONE = "America/Sao_Paulo";
const MAX_ROUTE_ITEMS = 20;

/** Data local do Brasil no formato YYYY-MM-DD. */
function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ROUTE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Meio-dia UTC da data YYYY-MM-DD evita deslocar o dia no @db.Date. */
function dateOnlyToUtcNoon(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00.000Z`);
}

function serializeRoute(route: {
  id: string;
  data: Date;
  status: string;
  itens: Array<{
    id: string;
    ordem: number;
    visitadoEm: Date | null;
    equipamento: Parameters<typeof mapEquipment>[0];
  }>;
}) {
  return {
    id: route.id,
    data: todayInSaoPauloFromDate(route.data),
    status: route.status,
    itens: route.itens.map((item) => ({
      id: item.id,
      ordem: item.ordem,
      visitado_em: item.visitadoEm?.toISOString(),
      equipamento: mapEquipment(item.equipamento),
    })),
  };
}

function todayInSaoPauloFromDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function buildSuggestedEquipmentIds(): Promise<string[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const priority = await prisma.equipamento.findMany({
    where: {
      OR: [
        { proximaManutencao: { lte: now } },
        { ultimaInspecao: null },
        { ultimaInspecao: { lt: thirtyDaysAgo } },
        { status: { in: ["parado", "manutencao"] } },
      ],
    },
    orderBy: [{ proximaManutencao: "asc" }, { nome: "asc" }],
    take: MAX_ROUTE_ITEMS,
    select: { id: true },
  });

  if (priority.length >= MAX_ROUTE_ITEMS) {
    return priority.map((item) => item.id);
  }

  const priorityIds = new Set(priority.map((item) => item.id));
  const remaining = MAX_ROUTE_ITEMS - priority.length;

  const fillers = await prisma.equipamento.findMany({
    where: priorityIds.size > 0 ? { id: { notIn: [...priorityIds] } } : undefined,
    orderBy: [{ proximaManutencao: "asc" }, { nome: "asc" }],
    take: remaining,
    select: { id: true },
  });

  return [...priority.map((item) => item.id), ...fillers.map((item) => item.id)];
}

const routeInclude = {
  itens: {
    include: { equipamento: { include: { cliente: true } } },
    orderBy: { ordem: "asc" as const },
  },
};

async function getOrCreateTodayRoute(tecnicoId: string) {
  const todayStr = todayInSaoPaulo();
  const today = dateOnlyToUtcNoon(todayStr);

  let route = await prisma.rotaDiaria.findUnique({
    where: {
      tecnicoId_data: {
        tecnicoId,
        data: today,
      },
    },
    include: routeInclude,
  });

  if (route) return route;

  const equipmentIds = await buildSuggestedEquipmentIds();

  return prisma.rotaDiaria.create({
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
    include: routeInclude,
  });
}

dailyRoutesRouter.get("/today", async (req, res) => {
  try {
    const route = await getOrCreateTodayRoute(req.auth!.userId);
    res.json(serializeRoute(route));
  } catch (error) {
    console.error("Erro ao buscar rota do dia:", error);
    res.status(500).json({ error: "Erro ao buscar rota do dia" });
  }
});

dailyRoutesRouter.patch("/start", async (req, res) => {
  try {
    const route = await getOrCreateTodayRoute(req.auth!.userId);

    if (route.status === "concluida") {
      res.status(400).json({ error: "A rota de hoje já foi concluída." });
      return;
    }

    const updated = await prisma.rotaDiaria.update({
      where: { id: route.id },
      data: { status: "em_andamento" },
      include: routeInclude,
    });

    res.json(serializeRoute(updated));
  } catch (error) {
    console.error("Erro ao iniciar rota:", error);
    res.status(500).json({ error: "Erro ao iniciar rota" });
  }
});

dailyRoutesRouter.patch("/items/:itemId/visit", async (req, res) => {
  try {
    const itemId = String(req.params.itemId);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.rotaItem.findUnique({
        where: { id: itemId },
        include: { rota: true },
      });

      if (!item || item.rota.tecnicoId !== req.auth!.userId) {
        return null;
      }

      if (item.visitadoEm) {
        return {
          alreadyVisited: true as const,
          visitado_em: item.visitadoEm.toISOString(),
          routeId: item.rotaId,
        };
      }

      const updated = await tx.rotaItem.update({
        where: { id: itemId },
        data: { visitadoEm: new Date() },
      });

      const pending = await tx.rotaItem.count({
        where: { rotaId: item.rotaId, visitadoEm: null },
      });

      await tx.rotaDiaria.update({
        where: { id: item.rotaId },
        data: {
          status: pending === 0 ? "concluida" : "em_andamento",
        },
      });

      return {
        alreadyVisited: false as const,
        visitado_em: updated.visitadoEm?.toISOString(),
        routeId: item.rotaId,
      };
    });

    if (!result) {
      res.status(404).json({ error: "Item da rota não encontrado" });
      return;
    }

    res.json({ success: true, visitado_em: result.visitado_em });
  } catch (error) {
    console.error("Erro ao marcar visita:", error);
    res.status(500).json({ error: "Erro ao atualizar rota" });
  }
});

dailyRoutesRouter.post("/regenerate", async (req, res) => {
  try {
    const todayStr = todayInSaoPaulo();
    const today = dateOnlyToUtcNoon(todayStr);
    const tecnicoId = req.auth!.userId;
    const equipmentIds = await buildSuggestedEquipmentIds();

    const route = await prisma.$transaction(async (tx) => {
      await tx.rotaItem.deleteMany({
        where: {
          rota: {
            tecnicoId,
            data: today,
          },
        },
      });

      return tx.rotaDiaria.upsert({
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
            create: equipmentIds.map((equipamentoId, index) => ({
              equipamentoId,
              ordem: index + 1,
            })),
          },
        },
        include: routeInclude,
      });
    });

    res.json(serializeRoute(route));
  } catch (error) {
    console.error("Erro ao regenerar rota:", error);
    res.status(500).json({ error: "Erro ao regenerar rota" });
  }
});
