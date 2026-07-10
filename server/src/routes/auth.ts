import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mapUser } from "../lib/mappers";
import { persistImageData } from "../lib/media-storage";
import { sendPasswordResetEmail } from "../lib/email";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const resetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
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

const updateUserSchema = z.object({
  nome: z.string().min(2).optional(),
  cargo: z.string().min(2).optional(),
  empresa: z.string().min(2).optional(),
  role: z.enum(["admin", "tecnico"]).optional(),
  password: z.string().min(6).optional(),
});

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.usuario.findUnique({ where: { email: normalizedEmail } });

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

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.usuario.findUnique({ where: { email } });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        usuarioId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_RESET_URL ?? "dhe://reset-password";
    const resetUrl = `${appUrl}?token=${rawToken}`;
    const emailResult = await sendPasswordResetEmail(email, resetUrl);

    res.json({
      message: "Se o email estiver cadastrado, você receberá instruções em breve.",
      ...(emailResult.devToken ? { dev_reset_url: emailResult.devToken } : {}),
    });
    return;
  }

  res.json({ message: "Se o email estiver cadastrado, você receberá instruções em breve." });
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { usuario: true },
  });

  if (!token || token.usedAt || token.expiresAt < new Date()) {
    res.status(400).json({ error: "Token inválido ou expirado" });
    return;
  }

  const senhaHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: token.usuarioId },
      data: { senhaHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
  ]);

  res.json({ message: "Senha redefinida com sucesso" });
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

  try {
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
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
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

authRouter.get("/users", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const users = await prisma.usuario.findMany({ orderBy: { nome: "asc" } });
    res.json(users.map(mapUser));
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

authRouter.put("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const id = String(req.params.id);
  const data = parsed.data;

  try {
    const existing = await prisma.usuario.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    const updateData: {
      nome?: string;
      cargo?: string;
      empresa?: string;
      role?: "admin" | "tecnico";
      senhaHash?: string;
    } = {};

    if (data.nome) updateData.nome = data.nome;
    if (data.cargo) updateData.cargo = data.cargo;
    if (data.empresa) updateData.empresa = data.empresa;
    if (data.role) updateData.role = data.role;
    if (data.password) updateData.senhaHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    res.json(mapUser(user));
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

authRouter.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const id = String(req.params.id);

  if (id === req.auth!.userId) {
    res.status(400).json({ error: "Você não pode remover sua própria conta." });
    return;
  }

  try {
    const inspectionCount = await prisma.inspecao.count({ where: { tecnicoId: id } });
    if (inspectionCount > 0) {
      res.status(409).json({
        error: "Usuário possui inspeções registradas e não pode ser removido.",
      });
      return;
    }

    await prisma.usuario.delete({ where: { id } });
    res.json({ message: "Usuário removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover usuário:", error);
    res.status(500).json({ error: "Erro ao remover usuário" });
  }
});
