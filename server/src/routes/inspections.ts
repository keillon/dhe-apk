import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapInspection } from "../lib/mappers";
import { parseOptionalDate } from "../lib/parse-date";
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

const fotoSchema = z.object({
  tipo: z.enum(["antes", "depois"]),
  url: z.string().min(1),
});

const createInspectionSchema = z.object({
  equipamento_id: z.string().min(1),
  tecnico_id: z.string().min(1),
  nivel_oleo: z.number().min(0).max(100),
  contaminacao_oleo: z.enum(["baixa", "media", "alta"]),
  data_ultima_limpeza: z.string().min(1),
  complemento: z.string().optional(),
  checklist: checklistSchema,
  fotos: z.array(fotoSchema).min(2).max(10),
  assinatura_url: z.string().min(1),
});

export const inspectionsRouter = Router();

inspectionsRouter.use(authMiddleware);

inspectionsRouter.get("/equipment/:equipmentId", async (req, res) => {
  try {
    const inspections = await prisma.inspecao.findMany({
      where: { equipamentoId: req.params.equipmentId },
      include: { tecnico: true, fotos: true, assinatura: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(inspections.map(mapInspection));
  } catch (error) {
    console.error("Erro ao listar inspeções:", error);
    res.status(500).json({ error: "Erro ao buscar inspeções" });
  }
});

inspectionsRouter.get("/:id", async (req, res) => {
  try {
    const inspection = await prisma.inspecao.findUnique({
      where: { id: req.params.id },
      include: { tecnico: true, fotos: true, assinatura: true },
    });

    if (!inspection) {
      res.status(404).json({ error: "Inspeção não encontrada" });
      return;
    }

    res.json(mapInspection(inspection));
  } catch (error) {
    console.error("Erro ao buscar inspeção:", error);
    res.status(500).json({ error: "Erro ao buscar inspeção" });
  }
});

inspectionsRouter.post("/", async (req, res) => {
  const parsed = createInspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;
  const tecnicoId = req.auth!.userId;

  const equipment = await prisma.equipamento.findUnique({
    where: { id: data.equipamento_id },
  });

  if (!equipment) {
    res.status(404).json({ error: "Equipamento não encontrado" });
    return;
  }

  const parsedDate = parseOptionalDate(data.data_ultima_limpeza);
  if (!data.data_ultima_limpeza || !parsedDate) {
    res.status(400).json({
      error: "Data da última limpeza é obrigatória. Use DD/MM/AAAA ou AAAA-MM-DD.",
    });
    return;
  }

  if (!data.fotos?.some((f) => f.tipo === "antes")) {
    res.status(400).json({ error: "Adicione pelo menos uma foto em Antes." });
    return;
  }

  if (!data.fotos?.some((f) => f.tipo === "depois")) {
    res.status(400).json({ error: "Adicione pelo menos uma foto em Depois." });
    return;
  }

  if (!data.assinatura_url) {
    res.status(400).json({ error: "A assinatura do cliente é obrigatória." });
    return;
  }

  const checklistOk = Object.values(data.checklist).some(Boolean);
  if (!checklistOk) {
    res.status(400).json({ error: "Marque pelo menos um item do checklist." });
    return;
  }

  try {
    const inspection = await prisma.$transaction(async (tx) => {
      const created = await tx.inspecao.create({
        data: {
          equipamentoId: data.equipamento_id,
          tecnicoId,
          nivelOleo: data.nivel_oleo,
          contaminacaoOleo: data.contaminacao_oleo,
          dataUltimaLimpeza: parsedDate,
          complemento: data.complemento,
          checklist: data.checklist,
        },
      });

      if (data.fotos?.length) {
        await tx.foto.createMany({
          data: data.fotos.map((foto) => ({
            inspecaoId: created.id,
            url: foto.url,
            tipo: foto.tipo,
          })),
        });
      }

      if (data.assinatura_url) {
        await tx.assinatura.create({
          data: {
            inspecaoId: created.id,
            url: data.assinatura_url,
          },
        });
      }

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
            fotos_count: data.fotos?.length ?? 0,
            tem_assinatura: !!data.assinatura_url,
            created_at: created.createdAt,
          },
        },
      });

      await tx.equipamento.update({
        where: { id: created.equipamentoId },
        data: { ultimaInspecao: created.createdAt },
      });

      return tx.inspecao.findUniqueOrThrow({
        where: { id: created.id },
        include: { tecnico: true, fotos: true, assinatura: true },
      });
    });

    res.status(201).json(mapInspection(inspection));
  } catch (error) {
    console.error("Erro ao criar inspeção:", error);
    res.status(500).json({ error: "Erro ao salvar inspeção no banco de dados" });
  }
});
