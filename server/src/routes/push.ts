import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
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

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

async function sendExpoPushMessages(
  tokens: string[],
  title: string,
  body: string
): Promise<ExpoPushTicket[]> {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      tokens.map((token) => ({
        to: token,
        sound: "default",
        title,
        body,
        data: { source: "admin-test" },
      }))
    ),
  });

  if (!response.ok) {
    throw new Error(`Expo Push API retornou ${response.status}`);
  }

  const payload = (await response.json()) as { data?: ExpoPushTicket[] };
  return payload.data ?? [];
}

pushRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Token inválido" });
    return;
  }

  const { token, platform } = parsed.data;

  await prisma.pushToken.upsert({
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
  });

  res.json({ success: true });
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
