import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.auth?.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const user = await prisma.usuario.findUnique({
    where: { id: req.auth.userId },
    select: { role: true },
  });

  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Acesso restrito a administradores" });
    return;
  }

  next();
}
