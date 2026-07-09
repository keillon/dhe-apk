import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapEquipment } from "../lib/mappers";
import { generateNextQrCode } from "../lib/qr-code";
import { parseOptionalDate } from "../lib/parse-date";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const equipmentSchema = z.object({
  cliente_id: z.string().min(1),
  nome: z.string().min(2),
  patrimonio: z.string().min(1),
  marca: z.string().min(1),
  modelo: z.string().min(1),
  numero_serie: z.string().min(1),
  ano: z.number().int().min(1900).max(2100),
  localizacao: z.string().min(1),
  status: z.enum(["operando", "parado", "manutencao"]).default("operando"),
  proxima_manutencao: z.string().optional(),
  foto_url: z.string().optional(),
});

export const equipmentsRouter = Router();

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

equipmentsRouter.get("/qr/:qrCode", async (req, res) => {
  try {
    const equipment = await prisma.equipamento.findUnique({
      where: { qrCode: req.params.qrCode },
      include: { cliente: true },
    });

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

    const qrCode = await generateNextQrCode();

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
        status: data.status,
        fotoUrl: data.foto_url || null,
        proximaManutencao,
      },
      include: { cliente: true },
    });

    res.status(201).json(mapEquipment(equipment));
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

    const equipment = await prisma.equipamento.update({
      where: { id },
      data: {
        clienteId: data.cliente_id,
        empresa: client.empresa,
        nome: data.nome,
        patrimonio: data.patrimonio,
        marca: data.marca,
        modelo: data.modelo,
        numeroSerie: data.numero_serie,
        ano: data.ano,
        localizacao: data.localizacao,
        status: data.status,
        fotoUrl: data.foto_url || null,
        proximaManutencao,
      },
      include: { cliente: true },
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

    await prisma.equipamento.delete({ where: { id } });
    res.json({ message: "Equipamento removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover equipamento:", error);
    res.status(500).json({ error: "Erro ao remover equipamento" });
  }
});
