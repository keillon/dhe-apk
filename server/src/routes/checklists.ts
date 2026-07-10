import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const checklistItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  obrigatorio: z.boolean().default(false),
});

const templateSchema = z.object({
  tipo: z.string().min(1),
  nome: z.string().min(2),
  itens: z.array(checklistItemSchema).min(1),
});

export const checklistsRouter = Router();

checklistsRouter.use(authMiddleware);

checklistsRouter.get("/", async (_req, res) => {
  const templates = await prisma.checklistTemplate.findMany({ orderBy: { nome: "asc" } });
  res.json(
    templates.map((template) => ({
      id: template.id,
      tipo: template.tipo,
      nome: template.nome,
      itens: template.itens,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString(),
    }))
  );
});

checklistsRouter.get("/:tipo", async (req, res) => {
  const tipo = String(req.params.tipo).toLowerCase();
  const template = await prisma.checklistTemplate.findUnique({ where: { tipo } });

  if (!template) {
    const fallback = await prisma.checklistTemplate.findUnique({ where: { tipo: "geral" } });
    if (!fallback) {
      res.status(404).json({ error: "Checklist não encontrado" });
      return;
    }

    res.json({
      id: fallback.id,
      tipo: fallback.tipo,
      nome: fallback.nome,
      itens: fallback.itens,
    });
    return;
  }

  res.json({
    id: template.id,
    tipo: template.tipo,
    nome: template.nome,
    itens: template.itens,
  });
});

checklistsRouter.put("/:tipo", adminMiddleware, async (req, res) => {
  const parsed = templateSchema.safeParse({ ...req.body, tipo: req.params.tipo });
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const template = await prisma.checklistTemplate.upsert({
    where: { tipo: parsed.data.tipo },
    create: parsed.data,
    update: {
      nome: parsed.data.nome,
      itens: parsed.data.itens,
    },
  });

  res.json({
    id: template.id,
    tipo: template.tipo,
    nome: template.nome,
    itens: template.itens,
  });
});
