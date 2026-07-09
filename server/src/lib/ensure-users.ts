import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function ensureDefaultUsers(): Promise<void> {
  const senhaHash = await bcrypt.hash("123456", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@dhepr.com.br" },
    update: {
      role: "admin",
      senhaHash,
      nome: "Administrador DHE",
      cargo: "Administrador",
    },
    create: {
      email: "admin@dhepr.com.br",
      senhaHash,
      nome: "Administrador DHE",
      cargo: "Administrador",
      empresa: "DHE Componentes Hidráulicos",
      role: "admin",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "tecnico@dhepr.com.br" },
    update: {
      role: "tecnico",
      senhaHash,
      nome: "João Silva",
      cargo: "Técnico Hidráulico",
    },
    create: {
      email: "tecnico@dhepr.com.br",
      senhaHash,
      nome: "João Silva",
      cargo: "Técnico Hidráulico",
      empresa: "DHE Componentes Hidráulicos",
      role: "tecnico",
    },
  });
}
