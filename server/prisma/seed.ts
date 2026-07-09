import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("123456", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@dhepr.com.br" },
    update: { role: "admin" },
    create: {
      email: "admin@dhepr.com.br",
      senhaHash,
      nome: "Administrador DHE",
      cargo: "Administrador",
      empresa: "DHE Componentes Hidráulicos",
      role: "admin",
    },
  });

  const tecnico = await prisma.usuario.upsert({
    where: { email: "tecnico@dhepr.com.br" },
    update: { role: "tecnico" },
    create: {
      email: "tecnico@dhepr.com.br",
      senhaHash,
      nome: "João Silva",
      cargo: "Técnico Hidráulico",
      empresa: "DHE Componentes Hidráulicos",
      role: "tecnico",
    },
  });

  const fmm = await prisma.cliente.upsert({
    where: { id: "seed-cliente-fmm" },
    update: {},
    create: {
      id: "seed-cliente-fmm",
      nome: "Carlos Mendes",
      empresa: "FMM Indústria",
      email: "carlos@fmm.com.br",
      telefone: "(41) 99999-0001",
    },
  });

  const metalSul = await prisma.cliente.upsert({
    where: { id: "seed-cliente-metalsul" },
    update: {},
    create: {
      id: "seed-cliente-metalsul",
      nome: "Ana Paula",
      empresa: "Metalúrgica Sul",
      email: "ana@metalsul.com.br",
      telefone: "(41) 99999-0002",
    },
  });

  const now = new Date();

  await prisma.equipamento.upsert({
    where: { qrCode: "DHE-0001" },
    update: {},
    create: {
      qrCode: "DHE-0001",
      clienteId: fmm.id,
      empresa: "FMM Indústria",
      nome: "Prensa Hidráulica 500T",
      patrimonio: "PAT-001",
      marca: "Parker",
      modelo: "PH-500",
      numeroSerie: "SN-2020-001",
      ano: 2020,
      localizacao: "Setor A - Linha 1",
      status: "operando",
      ultimaInspecao: new Date(now.getTime() - 15 * 86400000),
      proximaManutencao: new Date(now.getTime() + 15 * 86400000),
    },
  });

  await prisma.equipamento.upsert({
    where: { qrCode: "DHE-0002" },
    update: {},
    create: {
      qrCode: "DHE-0002",
      clienteId: fmm.id,
      empresa: "FMM Indústria",
      nome: "Injetora Hidráulica",
      patrimonio: "PAT-002",
      marca: "Bosch",
      modelo: "IH-200",
      numeroSerie: "SN-2019-045",
      ano: 2019,
      localizacao: "Setor B - Linha 3",
      status: "manutencao",
      ultimaInspecao: new Date(now.getTime() - 45 * 86400000),
      proximaManutencao: new Date(now.getTime() - 5 * 86400000),
    },
  });

  await prisma.equipamento.upsert({
    where: { qrCode: "DHE-0003" },
    update: {},
    create: {
      qrCode: "DHE-0003",
      clienteId: metalSul.id,
      empresa: "Metalúrgica Sul",
      nome: "Guindaste Hidráulico",
      patrimonio: "PAT-003",
      marca: "Liebherr",
      modelo: "GH-50",
      numeroSerie: "SN-2021-112",
      ano: 2021,
      localizacao: "Pátio Externo",
      status: "operando",
      ultimaInspecao: new Date(now.getTime() - 7 * 86400000),
      proximaManutencao: new Date(now.getTime() + 23 * 86400000),
    },
  });

  const injetora = await prisma.equipamento.findUnique({
    where: { qrCode: "DHE-0002" },
  });

  if (injetora) {
    await prisma.notificacao.createMany({
      data: [
        {
          usuarioId: tecnico.id,
          equipamentoId: injetora.id,
          tipo: "manutencao_vencida",
          titulo: "Manutenção vencida",
          mensagem:
            "Injetora Hidráulica (DHE-0002) está com manutenção vencida há 5 dias.",
        },
        {
          usuarioId: tecnico.id,
          equipamentoId: injetora.id,
          tipo: "oleo_contaminado",
          titulo: "Óleo contaminado",
          mensagem:
            "Última inspeção da Injetora Hidráulica indicou contaminação alta.",
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log("Seed DHE concluído com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
