import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapUser } from "../lib/mappers";
import { authMiddleware } from "../middleware/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const resetSchema = z.object({
  email: z.string().email(),
});

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.usuario.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const valid = await bcrypt.compare(password, user.senhaHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET não configurado" });
    return;
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
    expiresIn: "30d",
  });

  res.json({ token, user: mapUser(user) });
});

authRouter.post("/forgot-password", async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email inválido" });
    return;
  }

  // Placeholder: integrar com serviço de email quando disponível
  res.json({ message: "Se o email estiver cadastrado, você receberá instruções em breve." });
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  const user = await prisma.usuario.findUnique({
    where: { id: req.auth!.userId },
  });

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json(mapUser(user));
});
