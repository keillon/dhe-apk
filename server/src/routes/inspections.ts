import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapInspection, mapEquipment } from "../lib/mappers";
import { parseOptionalDate } from "../lib/parse-date";
import { persistInspectionMedia } from "../lib/media-storage";
import {
  buildInspectionExportWhere,
  buildInspectionsCsv,
  buildInspectionsExcelXml,
} from "../lib/inspection-export";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware, canUserManageInspection } from "../middleware/admin";

const checklistSchema = z.record(z.boolean());

const fotoSchema = z.object({
  tipo: z.enum(["antes", "depois"]),
  url: z.string().min(1),
  media_kind: z.enum(["image", "video"]).default("image"),
});

const inspectionPayloadSchema = z.object({
  nivel_oleo: z.number().min(0).max(100),
  contaminacao_oleo: z.enum(["baixa", "media", "alta"]),
  data_ultima_limpeza: z.string().min(1),
  complemento: z.string().optional(),
  checklist: checklistSchema,
  fotos: z.array(fotoSchema).min(1).max(20),
  assinatura_url: z.string().min(1),
});

const createInspectionSchema = inspectionPayloadSchema.extend({
  equipamento_id: z.string().min(1),
  tecnico_id: z.string().min(1),
  client_request_id: z.string().min(8).optional(),
});

const updateInspectionSchema = inspectionPayloadSchema;

function validateInspectionFields(data: z.infer<typeof inspectionPayloadSchema>) {
  const parsedDate = parseOptionalDate(data.data_ultima_limpeza);
  if (!parsedDate) {
    return { error: "Data da última limpeza inválida. Use DD/MM/AAAA ou AAAA-MM-DD." };
  }

  if (!data.fotos.some((f) => f.tipo === "antes")) {
    return { error: "Adicione pelo menos uma mídia em Antes." };
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

inspectionsRouter.get("/export", adminMiddleware, async (req, res) => {
  try {
    const format = typeof req.query.format === "string" ? req.query.format : "csv";
    const where = buildInspectionExportWhere({
      tecnico_id: typeof req.query.tecnico_id === "string" ? req.query.tecnico_id : undefined,
      contaminacao:
        typeof req.query.contaminacao === "string" ? req.query.contaminacao : undefined,
      period: typeof req.query.period === "string" ? req.query.period : undefined,
    });

    const inspections = await prisma.inspecao.findMany({
      where,
      include: {
        tecnico: true,
        assinatura: true,
        equipamento: { include: { cliente: true } },
        _count: { select: { fotos: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "excel" || format === "xls") {
      const xml = buildInspectionsExcelXml(inspections);
      res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="inspecoes-dhe.xls"');
      res.send(xml);
      return;
    }

    const csv = buildInspectionsCsv(inspections);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="inspecoes-dhe.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Erro ao exportar inspeções:", error);
    res.status(500).json({ error: "Erro ao exportar inspeções" });
  }
});

inspectionsRouter.get("/all", adminMiddleware, async (req, res) => {
  try {
    const tecnicoId = typeof req.query.tecnico_id === "string" ? req.query.tecnico_id : undefined;
    const period = typeof req.query.period === "string" ? req.query.period : "all";
    const contamination =
      typeof req.query.contamination === "string" ? req.query.contamination : "all";

    const where: {
      tecnicoId?: string;
      contaminacaoOleo?: "baixa" | "media" | "alta";
      createdAt?: { gte: Date };
    } = {};

    if (tecnicoId && tecnicoId !== "all") {
      where.tecnicoId = tecnicoId;
    }

    if (contamination !== "all" && ["baixa", "media", "alta"].includes(contamination)) {
      where.contaminacaoOleo = contamination as "baixa" | "media" | "alta";
    }

    if (period === "30d") {
      where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (period === "90d") {
      where.createdAt = { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
    }

    const inspections = await prisma.inspecao.findMany({
      where,
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
    console.error("Erro ao listar todas as inspeções:", error);
    res.status(500).json({ error: "Erro ao buscar inspeções" });
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
      include: {
        tecnico: true,
        fotos: true,
        assinatura: true,
        equipamento: { include: { cliente: true } },
      },
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

  if (data.client_request_id) {
    const existing = await prisma.inspecao.findUnique({
      where: { clientRequestId: data.client_request_id },
      include: { tecnico: true, fotos: true, assinatura: true },
    });

    if (existing) {
      res.status(200).json(mapInspection(existing));
      return;
    }
  }

  try {
    const inspection = await prisma.$transaction(async (tx) => {
      const created = await tx.inspecao.create({
        data: {
          clientRequestId: data.client_request_id ?? null,
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
          mediaKind: foto.media_kind,
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

inspectionsRouter.put("/:id", async (req, res) => {
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

  const allowed = await canUserManageInspection(req.auth!.userId, existing.tecnicoId);
  if (!allowed) {
    res.status(403).json({ error: "Você só pode editar suas próprias inspeções." });
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
          mediaKind: foto.media_kind,
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

inspectionsRouter.delete("/:id", async (req, res) => {
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

    const allowed = await canUserManageInspection(req.auth!.userId, existing.tecnicoId);
    if (!allowed) {
      res.status(403).json({ error: "Você só pode excluir suas próprias inspeções." });
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
