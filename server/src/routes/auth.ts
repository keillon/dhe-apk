import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapUser } from "../lib/mappers";
import { persistImageData } from "../lib/media-storage";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const resetSchema = z.object({
  email: z.string().email(),
});

const updateProfileSchema = z.object({
  nome: z.string().min(2).max(120).optional(),
  foto_url: z.string().optional(),
});

const changePasswordSchema = z.object({
  senha_atual: z.string().min(1),
  senha_nova: z.string().min(6),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nome: z.string().min(2),
  cargo: z.string().min(2).optional(),
  empresa: z.string().min(2).optional(),
  role: z.enum(["admin", "tecnico"]).default("tecnico"),
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
    expiresIn: "365d",
  });

  res.json({ token, user: mapUser(user) });
});

authRouter.post("/forgot-password", async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email inválido" });
    return;
  }

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

authRouter.patch("/profile", authMiddleware, async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const data = parsed.data;
  let fotoUrl: string | undefined;

  if (data.foto_url) {
    fotoUrl = await persistImageData(data.foto_url, `users/${req.auth!.userId}`);
  }

  const user = await prisma.usuario.update({
    where: { id: req.auth!.userId },
    data: {
      ...(data.nome ? { nome: data.nome } : {}),
      ...(fotoUrl ? { fotoUrl } : {}),
    },
  });

  res.json(mapUser(user));
});

authRouter.patch("/password", authMiddleware, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const user = await prisma.usuario.findUnique({
    where: { id: req.auth!.userId },
  });

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.senha_atual, user.senhaHash);
  if (!valid) {
    res.status(400).json({ error: "Senha atual incorreta" });
    return;
  }

  const senhaHash = await bcrypt.hash(parsed.data.senha_nova, 10);
  await prisma.usuario.update({
    where: { id: user.id },
    data: { senhaHash },
  });

  res.json({ message: "Senha alterada com sucesso" });
});

authRouter.post("/users", authMiddleware, adminMiddleware, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const data = parsed.data;
  const existing = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existing) {
    res.status(409).json({ error: "Email já cadastrado" });
    return;
  }

  const senhaHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.usuario.create({
    data: {
      email: data.email,
      senhaHash,
      nome: data.nome,
      cargo: data.cargo ?? "Técnico",
      empresa: data.empresa ?? "DHE Componentes Hidráulicos",
      role: data.role,
    },
  });

  res.status(201).json(mapUser(user));
});
