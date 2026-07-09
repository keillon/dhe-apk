import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapClient } from "../lib/mappers";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const clientSchema = z.object({
  nome: z.string().min(2),
  empresa: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().optional(),
});

export const clientsRouter = Router();

clientsRouter.use(authMiddleware);

clientsRouter.get("/", async (_req, res) => {
  try {
    const clients = await prisma.cliente.findMany({ orderBy: { nome: "asc" } });
    res.json(clients.map(mapClient));
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

clientsRouter.get("/:id", async (req, res) => {
  try {
    const client = await prisma.cliente.findUnique({ where: { id: String(req.params.id) } });

    if (!client) {
      res.status(404).json({ error: "Cliente não encontrado" });
      return;
    }

    res.json(mapClient(client));
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

clientsRouter.post("/", adminMiddleware, async (req, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  try {
    const client = await prisma.cliente.create({
      data: {
        nome: parsed.data.nome,
        empresa: parsed.data.empresa,
        email: parsed.data.email || null,
        telefone: parsed.data.telefone || null,
      },
    });

    res.status(201).json(mapClient(client));
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

clientsRouter.put("/:id", adminMiddleware, async (req, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const id = String(req.params.id);

  try {
    const existing = await prisma.cliente.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Cliente não encontrado" });
      return;
    }

    const client = await prisma.cliente.update({
      where: { id },
      data: {
        nome: parsed.data.nome,
        empresa: parsed.data.empresa,
        email: parsed.data.email || null,
        telefone: parsed.data.telefone || null,
      },
    });

    await prisma.equipamento.updateMany({
      where: { clienteId: id },
      data: { empresa: parsed.data.empresa },
    });

    res.json(mapClient(client));
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

clientsRouter.delete("/:id", adminMiddleware, async (req, res) => {
  const id = String(req.params.id);

  try {
    const equipmentCount = await prisma.equipamento.count({ where: { clienteId: id } });
    if (equipmentCount > 0) {
      res.status(409).json({
        error: "Cliente possui equipamentos cadastrados. Remova os equipamentos antes.",
      });
      return;
    }

    await prisma.cliente.delete({ where: { id } });
    res.json({ message: "Cliente removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover cliente:", error);
    res.status(500).json({ error: "Erro ao remover cliente" });
  }
});
