import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { sendExpoPushMessages } from "../lib/expo-push";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

export const pushRouter = Router();

pushRouter.use(authMiddleware);

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.string().optional(),
});

const testSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(500).optional(),
});

pushRouter.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Token inválido" });
      return;
    }

    const { token, platform } = parsed.data;

    const saved = await prisma.pushToken.upsert({
      where: { token },
      create: {
        usuarioId: req.auth!.userId,
        token,
        platform,
      },
      update: {
        usuarioId: req.auth!.userId,
        platform,
      },
      select: {
        id: true,
        platform: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, device: saved });
  } catch (error) {
    console.error("Erro ao registrar push token:", error);
    res.status(500).json({ error: "Erro ao registrar token push" });
  }
});

pushRouter.get("/tokens", adminMiddleware, async (req, res) => {
  const tokens = await prisma.pushToken.findMany({
    where: { usuarioId: req.auth!.userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      token: true,
      platform: true,
      updatedAt: true,
    },
  });

  res.json(tokens);
});

pushRouter.get("/devices", adminMiddleware, async (_req, res) => {
  try {
    const devices = await prisma.pushToken.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        platform: true,
        updatedAt: true,
        token: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    res.json({
      count: devices.length,
      devices: devices.map((device) => ({
        id: device.id,
        platform: device.platform,
        updatedAt: device.updatedAt,
        tokenPreview: `${device.token.slice(0, 22)}…`,
        usuario: device.usuario,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar dispositivos push:", error);
    res.status(500).json({ error: "Erro ao listar dispositivos" });
  }
});

pushRouter.post("/test", adminMiddleware, async (req, res) => {
  const parsed = testSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const title = parsed.data.title ?? "Teste DHE";
  const body =
    parsed.data.body ?? "Notificação push de teste enviada pelo painel admin.";

  const storedTokens = await prisma.pushToken.findMany({
    where: { usuarioId: req.auth!.userId },
    select: { token: true },
  });

  if (storedTokens.length === 0) {
    res.status(400).json({
      error: "Nenhum token push registrado. Registre o token deste aparelho primeiro.",
    });
    return;
  }

  try {
    const tickets = await sendExpoPushMessages(
      storedTokens.map((item: { token: string }) => item.token),
      title,
      body
    );

    const errors = tickets.filter((ticket) => ticket.status === "error");

    res.json({
      success: errors.length === 0,
      sent: tickets.length,
      errors: errors.map((ticket) => ticket.message ?? ticket.details?.error ?? "Erro desconhecido"),
      tickets,
    });
  } catch (error) {
    console.error("Erro ao enviar push de teste:", error);
    res.status(500).json({ error: "Erro ao enviar notificação push" });
  }
});
