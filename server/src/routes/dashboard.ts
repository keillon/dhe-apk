import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

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
