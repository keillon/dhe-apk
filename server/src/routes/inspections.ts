import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapInspection } from "../lib/mappers";
import { authMiddleware } from "../middleware/auth";

const checklistSchema = z.object({
  vazamentos: z.boolean(),
  mangueiras: z.boolean(),
  cilindros: z.boolean(),
  motor: z.boolean(),
  bomba: z.boolean(),
  pressao: z.boolean(),
  temperatura: z.boolean(),
  filtros: z.boolean(),
  ruidos: z.boolean(),
  acoplamentos: z.boolean(),
});

const createInspectionSchema = z.object({
  equipamento_id: z.string().min(1),
  tecnico_id: z.string().min(1),
  nivel_oleo: z.number().min(0).max(100),
  contaminacao_oleo: z.enum(["baixa", "media", "alta"]),
  data_ultima_limpeza: z.string().optional(),
  complemento: z.string().optional(),
  checklist: checklistSchema,
});

export const inspectionsRouter = Router();

inspectionsRouter.use(authMiddleware);

inspectionsRouter.get("/equipment/:equipmentId", async (req, res) => {
  const inspections = await prisma.inspecao.findMany({
    where: { equipamentoId: req.params.equipmentId },
    include: { tecnico: true, fotos: true, assinatura: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(inspections.map(mapInspection));
});

inspectionsRouter.get("/:id", async (req, res) => {
  const inspection = await prisma.inspecao.findUnique({
    where: { id: req.params.id },
    include: { tecnico: true, fotos: true, assinatura: true },
  });

  if (!inspection) {
    res.status(404).json({ error: "Inspeção não encontrada" });
    return;
  }

  res.json(mapInspection(inspection));
});

inspectionsRouter.post("/", async (req, res) => {
  const parsed = createInspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;

  const inspection = await prisma.$transaction(async (tx) => {
    const created = await tx.inspecao.create({
      data: {
        equipamentoId: data.equipamento_id,
        tecnicoId: data.tecnico_id,
        nivelOleo: data.nivel_oleo,
        contaminacaoOleo: data.contaminacao_oleo,
        dataUltimaLimpeza: data.data_ultima_limpeza
          ? new Date(data.data_ultima_limpeza)
          : undefined,
        complemento: data.complemento,
        checklist: data.checklist,
      },
      include: { tecnico: true, fotos: true, assinatura: true },
    });

    await tx.historico.create({
      data: {
        inspecaoId: created.id,
        equipamentoId: created.equipamentoId,
        tecnicoId: created.tecnicoId,
        dados: {
          nivel_oleo: created.nivelOleo,
          contaminacao_oleo: created.contaminacaoOleo,
          data_ultima_limpeza: created.dataUltimaLimpeza,
          complemento: created.complemento,
          checklist: created.checklist,
          created_at: created.createdAt,
        },
      },
    });

    await tx.equipamento.update({
      where: { id: created.equipamentoId },
      data: { ultimaInspecao: created.createdAt },
    });

    return created;
  });

  res.status(201).json(mapInspection(inspection));
});
