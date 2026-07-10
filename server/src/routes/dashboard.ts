import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

dashboardRouter.get("/stats", async (_req, res) => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    equipamentosCadastrados,
    inspecoesRealizadas,
    pendencias,
    proximasManutencoes,
    inspecoesHoje,
  ] = await Promise.all([
    prisma.equipamento.count(),
    prisma.inspecao.count(),
    prisma.equipamento.count({
      where: { proximaManutencao: { lt: now } },
    }),
    prisma.equipamento.count({
      where: {
        proximaManutencao: { gt: now, lt: thirtyDaysAhead },
      },
    }),
    prisma.inspecao.count({
      where: { createdAt: { gte: todayStart } },
    }),
  ]);

  res.json({
    equipamentos_cadastrados: equipamentosCadastrados,
    inspecoes_realizadas: inspecoesRealizadas,
    pendencias,
    proximas_manutencoes: proximasManutencoes,
    inspecoes_hoje: inspecoesHoje,
  });
});

dashboardRouter.get("/charts", adminMiddleware, async (_req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const inspections = await prisma.inspecao.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, contaminacaoOleo: true },
  });

  const monthMap = new Map<string, number>();
  for (let i = 0; i < 6; i += 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, 0);
  }

  const contaminationMap = new Map<string, number>([
    ["baixa", 0],
    ["media", 0],
    ["alta", 0],
  ]);

  for (const inspection of inspections) {
    const key = `${inspection.createdAt.getFullYear()}-${String(inspection.createdAt.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    contaminationMap.set(
      inspection.contaminacaoOleo,
      (contaminationMap.get(inspection.contaminacaoOleo) ?? 0) + 1
    );
  }

  const statusGroups = await prisma.equipamento.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  res.json({
    inspecoes_por_mes: Array.from(monthMap.entries()).map(([mes, total]) => ({ mes, total })),
    equipamentos_por_status: statusGroups.map((group) => ({
      status: group.status,
      total: group._count._all,
    })),
    contaminacao_distribuicao: Array.from(contaminationMap.entries()).map(([nivel, total]) => ({
      nivel,
      total,
    })),
  });
});
