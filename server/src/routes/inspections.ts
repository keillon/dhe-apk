import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapInspection, mapEquipment } from "../lib/mappers";
import { parseOptionalDate } from "../lib/parse-date";
import { persistInspectionMedia } from "../lib/media-storage";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

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

const inspectionPayloadSchema = z.object({
  nivel_oleo: z.number().min(0).max(100),
  contaminacao_oleo: z.enum(["baixa", "media", "alta"]),
  data_ultima_limpeza: z.string().min(1),
  complemento: z.string().optional(),
  checklist: checklistSchema,
  fotos: z.array(fotoSchema).min(2).max(10),
  assinatura_url: z.string().min(1),
});

const createInspectionSchema = inspectionPayloadSchema.extend({
  equipamento_id: z.string().min(1),
  tecnico_id: z.string().min(1),
});

const updateInspectionSchema = inspectionPayloadSchema;

function validateInspectionFields(data: z.infer<typeof inspectionPayloadSchema>) {
  const parsedDate = parseOptionalDate(data.data_ultima_limpeza);
  if (!parsedDate) {
    return { error: "Data da última limpeza inválida. Use DD/MM/AAAA ou AAAA-MM-DD." };
  }

  if (!data.fotos.some((f) => f.tipo === "antes")) {
    return { error: "Adicione pelo menos uma foto em Antes." };
  }

  if (!data.fotos.some((f) => f.tipo === "depois")) {
    return { error: "Adicione pelo menos uma foto em Depois." };
  }

  if (!Object.values(data.checklist).some(Boolean)) {
    return { error: "Marque pelo menos um item do checklist." };
  }

  return { parsedDate };
}

async function saveInspectionMedia(
  inspecaoId: string,
  fotos: z.infer<typeof fotoSchema>[],
  assinaturaUrl: string
) {
  return persistInspectionMedia(inspecaoId, fotos, assinaturaUrl);
}

export const inspectionsRouter = Router();

inspectionsRouter.use(authMiddleware);

inspectionsRouter.get("/me", async (req, res) => {
  try {
    const inspections = await prisma.inspecao.findMany({
      where: { tecnicoId: req.auth!.userId },
      include: {
        tecnico: true,
        fotos: true,
        assinatura: true,
        equipamento: { include: { cliente: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      inspections.map((inspection) => ({
        ...mapInspection(inspection),
        equipamento: mapEquipment(inspection.equipamento),
      }))
    );
  } catch (error) {
    console.error("Erro ao listar minhas inspeções:", error);
    res.status(500).json({ error: "Erro ao buscar suas inspeções" });
  }
});

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
  const validation = validateInspectionFields(data);

  if ("error" in validation) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const equipment = await prisma.equipamento.findUnique({
    where: { id: data.equipamento_id },
  });

  if (!equipment) {
    res.status(404).json({ error: "Equipamento não encontrado" });
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
          dataUltimaLimpeza: validation.parsedDate,
          complemento: data.complemento,
          checklist: data.checklist,
        },
      });

      const media = await saveInspectionMedia(created.id, data.fotos, data.assinatura_url);

      await tx.foto.createMany({
        data: media.fotos.map((foto) => ({
          inspecaoId: created.id,
          url: foto.url,
          tipo: foto.tipo,
        })),
      });

      await tx.assinatura.create({
        data: {
          inspecaoId: created.id,
          url: media.assinaturaUrl,
        },
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
            fotos_count: media.fotos.length,
            tem_assinatura: true,
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

inspectionsRouter.put("/:id", adminMiddleware, async (req, res) => {
  const inspectionId = String(req.params.id);
  const parsed = updateInspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;
  const validation = validateInspectionFields(data);

  if ("error" in validation) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const existing = await prisma.inspecao.findUnique({
    where: { id: inspectionId },
    include: { fotos: true, assinatura: true },
  });

  if (!existing) {
    res.status(404).json({ error: "Inspeção não encontrada" });
    return;
  }

  try {
    const inspection = await prisma.$transaction(async (tx) => {
      const updated = await tx.inspecao.update({
        where: { id: existing.id },
        data: {
          nivelOleo: data.nivel_oleo,
          contaminacaoOleo: data.contaminacao_oleo,
          dataUltimaLimpeza: validation.parsedDate,
          complemento: data.complemento,
          checklist: data.checklist,
        },
      });

      await tx.foto.deleteMany({ where: { inspecaoId: existing.id } });
      if (existing.assinatura) {
        await tx.assinatura.delete({ where: { inspecaoId: existing.id } });
      }

      const media = await saveInspectionMedia(existing.id, data.fotos, data.assinatura_url);

      await tx.foto.createMany({
        data: media.fotos.map((foto) => ({
          inspecaoId: existing.id,
          url: foto.url,
          tipo: foto.tipo,
        })),
      });

      await tx.assinatura.create({
        data: {
          inspecaoId: existing.id,
          url: media.assinaturaUrl,
        },
      });

      await tx.historico.update({
        where: { inspecaoId: existing.id },
        data: {
          dados: {
            nivel_oleo: updated.nivelOleo,
            contaminacao_oleo: updated.contaminacaoOleo,
            data_ultima_limpeza: updated.dataUltimaLimpeza,
            complemento: updated.complemento,
            checklist: updated.checklist,
            fotos_count: media.fotos.length,
            tem_assinatura: true,
            updated_at: new Date().toISOString(),
          },
        },
      });

      return tx.inspecao.findUniqueOrThrow({
        where: { id: existing.id },
        include: { tecnico: true, fotos: true, assinatura: true },
      });
    });

    res.json(mapInspection(inspection));
  } catch (error) {
    console.error("Erro ao atualizar inspeção:", error);
    res.status(500).json({ error: "Erro ao atualizar inspeção" });
  }
});

inspectionsRouter.delete("/:id", adminMiddleware, async (req, res) => {
  const inspectionId = String(req.params.id);

  try {
    const existing = await prisma.inspecao.findUnique({
      where: { id: inspectionId },
      include: { assinatura: true },
    });

    if (!existing) {
      res.status(404).json({ error: "Inspeção não encontrada" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.historico.deleteMany({ where: { inspecaoId: inspectionId } });
      await tx.foto.deleteMany({ where: { inspecaoId: inspectionId } });
      if (existing.assinatura) {
        await tx.assinatura.delete({ where: { inspecaoId: inspectionId } });
      }
      await tx.inspecao.delete({ where: { id: inspectionId } });

      const lastInspection = await tx.inspecao.findFirst({
        where: { equipamentoId: existing.equipamentoId },
        orderBy: { createdAt: "desc" },
      });

      await tx.equipamento.update({
        where: { id: existing.equipamentoId },
        data: { ultimaInspecao: lastInspection?.createdAt ?? null },
      });
    });

    res.json({ message: "Inspeção removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover inspeção:", error);
    res.status(500).json({ error: "Erro ao remover inspeção" });
  }
});
