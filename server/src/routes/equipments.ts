import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapEquipment } from "../lib/mappers";
import { generateNextQrCode } from "../lib/qr-code";
import { persistImageData } from "../lib/media-storage";
import { parseOptionalDate } from "../lib/parse-date";
import { createAuditLog, pickAuditFields } from "../lib/audit-log";
import { adminMiddleware } from "../middleware/admin";
import { authMiddleware } from "../middleware/auth";

const equipmentSchema = z.object({
  cliente_id: z.string().min(1),
  nome: z.string().min(2),
  patrimonio: z.string().min(1),
  marca: z.string().min(1),
  modelo: z.string().min(1),
  numero_serie: z.string().min(1),
  ano: z.number().int().min(1900).max(2100),
  localizacao: z.string().min(1),
  tipo: z.string().optional(),
  status: z.enum(["operando", "parado", "manutencao"]).default("operando"),
  proxima_manutencao: z.string().optional(),
  foto_url: z.string().optional(),
  qr_code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9][A-Za-z0-9 _.-]*$/, "QR Code inválido")
    .optional(),
});

export const equipmentsRouter = Router();

async function resolveEquipmentPhoto(
  fotoUrl: string | undefined,
  equipmentId: string
): Promise<string | null> {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith("data:")) {
    return persistImageData(fotoUrl, `equipments/${equipmentId}`);
  }
  return fotoUrl;
}

equipmentsRouter.use(authMiddleware);

equipmentsRouter.get("/next-qr", adminMiddleware, async (_req, res) => {
  try {
    const qr_code = await generateNextQrCode();
    res.json({ qr_code });
  } catch (error) {
    console.error("Erro ao gerar QR:", error);
    res.status(500).json({ error: "Erro ao gerar QR Code" });
  }
});

equipmentsRouter.get("/", async (_req, res) => {
  try {
    const equipments = await prisma.equipamento.findMany({
      include: { cliente: true },
      orderBy: { nome: "asc" },
    });

    res.json(equipments.map(mapEquipment));
  } catch (error) {
    console.error("Erro ao listar equipamentos:", error);
    res.status(500).json({ error: "Erro ao buscar equipamentos" });
  }
});

function normalizeQrCode(value: string): string {
  return decodeURIComponent(value).trim().toUpperCase();
}

equipmentsRouter.get("/search", async (req, res) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query || query.length < 2) {
      res.status(400).json({ error: "Informe ao menos 2 caracteres para buscar." });
      return;
    }

    const equipments = await prisma.equipamento.findMany({
      where: {
        OR: [
          { qrCode: { contains: query, mode: "insensitive" } },
          { patrimonio: { contains: query, mode: "insensitive" } },
          { nome: { contains: query, mode: "insensitive" } },
          { empresa: { contains: query, mode: "insensitive" } },
          { cliente: { empresa: { contains: query, mode: "insensitive" } } },
          { cliente: { nome: { contains: query, mode: "insensitive" } } },
        ],
      },
      include: { cliente: true },
      orderBy: { nome: "asc" },
      take: 30,
    });

    res.json(equipments.map(mapEquipment));
  } catch (error) {
    console.error("Erro na busca de equipamentos:", error);
    res.status(500).json({ error: "Erro ao buscar equipamentos" });
  }
});

equipmentsRouter.get("/qr/:qrCode", async (req, res) => {
  try {
    const qrCode = normalizeQrCode(req.params.qrCode);

    let equipment = await prisma.equipamento.findUnique({
      where: { qrCode },
      include: { cliente: true },
    });

    if (!equipment) {
      equipment = await prisma.equipamento.findFirst({
        where: {
          qrCode: {
            equals: qrCode,
            mode: "insensitive",
          },
        },
        include: { cliente: true },
      });
    }

    if (!equipment) {
      res.status(404).json({ error: "Equipamento não encontrado" });
      return;
    }

    res.json(mapEquipment(equipment));
  } catch (error) {
    console.error("Erro ao buscar equipamento por QR:", error);
    res.status(500).json({ error: "Erro ao buscar equipamento" });
  }
});

equipmentsRouter.get("/:id", async (req, res) => {
  try {
    const equipment = await prisma.equipamento.findUnique({
      where: { id: String(req.params.id) },
      include: { cliente: true },
    });

    if (!equipment) {
      res.status(404).json({ error: "Equipamento não encontrado" });
      return;
    }

    res.json(mapEquipment(equipment));
  } catch (error) {
    console.error("Erro ao buscar equipamento:", error);
    res.status(500).json({ error: "Erro ao buscar equipamento" });
  }
});

equipmentsRouter.post("/", adminMiddleware, async (req, res) => {
  const parsed = equipmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;

  try {
    const client = await prisma.cliente.findUnique({ where: { id: data.cliente_id } });
    if (!client) {
      res.status(404).json({ error: "Cliente não encontrado" });
      return;
    }

    const proximaManutencao = data.proxima_manutencao
      ? parseOptionalDate(data.proxima_manutencao)
      : null;

    const requestedQr = data.qr_code ? normalizeQrCode(data.qr_code) : null;
    if (requestedQr) {
      const existingQr = await prisma.equipamento.findFirst({
        where: { qrCode: { equals: requestedQr, mode: "insensitive" } },
        select: { id: true },
      });
      if (existingQr) {
        res.status(409).json({ error: "Já existe um equipamento com este QR Code." });
        return;
      }
    }

    const qrCode = requestedQr ?? (await generateNextQrCode());

    const equipment = await prisma.equipamento.create({
      data: {
        qrCode,
        clienteId: data.cliente_id,
        empresa: client.empresa,
        nome: data.nome,
        patrimonio: data.patrimonio,
        marca: data.marca,
        modelo: data.modelo,
        numeroSerie: data.numero_serie,
        ano: data.ano,
        localizacao: data.localizacao,
        tipo: data.tipo ?? null,
        status: data.status,
        fotoUrl: null,
        proximaManutencao,
      },
      include: { cliente: true },
    });

    const persistedPhoto = await resolveEquipmentPhoto(data.foto_url, equipment.id);
    const finalEquipment =
      persistedPhoto !== equipment.fotoUrl
        ? await prisma.equipamento.update({
            where: { id: equipment.id },
            data: { fotoUrl: persistedPhoto },
            include: { cliente: true },
          })
        : equipment;

    await createAuditLog({
      entidade: "equipamento",
      entidadeId: finalEquipment.id,
      usuarioId: req.auth!.userId,
      acao: "create",
      depois: pickAuditFields(finalEquipment as unknown as Record<string, unknown>, [
        "nome",
        "patrimonio",
        "qrCode",
        "status",
        "tipo",
      ]),
    });

    res.status(201).json(mapEquipment(finalEquipment));
  } catch (error) {
    console.error("Erro ao criar equipamento:", error);
    res.status(500).json({ error: "Erro ao criar equipamento" });
  }
});

equipmentsRouter.put("/:id", adminMiddleware, async (req, res) => {
  const parsed = equipmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const id = String(req.params.id);
  const data = parsed.data;

  try {
    const existing = await prisma.equipamento.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Equipamento não encontrado" });
      return;
    }

    const client = await prisma.cliente.findUnique({ where: { id: data.cliente_id } });
    if (!client) {
      res.status(404).json({ error: "Cliente não encontrado" });
      return;
    }

    const proximaManutencao = data.proxima_manutencao
      ? parseOptionalDate(data.proxima_manutencao)
      : null;

    const fotoUrl = await resolveEquipmentPhoto(data.foto_url, id);

    const requestedQr = data.qr_code ? normalizeQrCode(data.qr_code) : null;
    if (requestedQr && requestedQr !== existing.qrCode.toUpperCase()) {
      const conflict = await prisma.equipamento.findFirst({
        where: {
          qrCode: { equals: requestedQr, mode: "insensitive" },
          NOT: { id },
        },
        select: { id: true },
      });
      if (conflict) {
        res.status(409).json({ error: "Já existe um equipamento com este QR Code." });
        return;
      }
    }

    const equipment = await prisma.equipamento.update({
      where: { id },
      data: {
        ...(requestedQr ? { qrCode: requestedQr } : {}),
        clienteId: data.cliente_id,
        empresa: client.empresa,
        nome: data.nome,
        patrimonio: data.patrimonio,
        marca: data.marca,
        modelo: data.modelo,
        numeroSerie: data.numero_serie,
        ano: data.ano,
        localizacao: data.localizacao,
        tipo: data.tipo ?? null,
        status: data.status,
        fotoUrl,
        proximaManutencao,
      },
      include: { cliente: true },
    });

    await createAuditLog({
      entidade: "equipamento",
      entidadeId: equipment.id,
      usuarioId: req.auth!.userId,
      acao: "update",
      antes: pickAuditFields(existing as unknown as Record<string, unknown>, [
        "nome",
        "patrimonio",
        "status",
        "tipo",
        "localizacao",
      ]),
      depois: pickAuditFields(equipment as unknown as Record<string, unknown>, [
        "nome",
        "patrimonio",
        "status",
        "tipo",
        "localizacao",
      ]),
    });

    res.json(mapEquipment(equipment));
  } catch (error) {
    console.error("Erro ao atualizar equipamento:", error);
    res.status(500).json({ error: "Erro ao atualizar equipamento" });
  }
});

equipmentsRouter.delete("/:id", adminMiddleware, async (req, res) => {
  const id = String(req.params.id);

  try {
    const inspectionCount = await prisma.inspecao.count({ where: { equipamentoId: id } });
    if (inspectionCount > 0) {
      res.status(409).json({
        error: "Equipamento possui inspeções. Remova as inspeções antes de excluir.",
      });
      return;
    }

    const existing = await prisma.equipamento.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Equipamento não encontrado" });
      return;
    }

    await createAuditLog({
      entidade: "equipamento",
      entidadeId: id,
      usuarioId: req.auth!.userId,
      acao: "delete",
      antes: pickAuditFields(existing as unknown as Record<string, unknown>, ["nome", "patrimonio", "qrCode"]),
    });

    await prisma.equipamento.delete({ where: { id } });
    res.json({ message: "Equipamento removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover equipamento:", error);
    res.status(500).json({ error: "Erro ao remover equipamento" });
  }
});
