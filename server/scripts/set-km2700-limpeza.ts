/**
 * Ajusta DHE-0001/DHE-0002 para os parâmetros oficiais KM 2700.
 * Uso (na VPS, pasta server):
 *   npx tsx scripts/set-km2700-limpeza.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGETS = [
  {
    qrCode: "DHE-0001",
    nome: "KM 2700-3",
    patrimonio: "KM-2700-3",
    marca: "Krauss Maffei",
    modelo: "KM 2700-3",
    numeroSerie: "SN-0758922",
    ano: 2016,
    localizacao: "Injeção",
    tipo: "Injetora",
    limpeza: new Date(2026, 2, 30),
  },
  {
    qrCode: "DHE-0002",
    nome: "KM 2700-4",
    patrimonio: "KM-2700-4",
    marca: "Krauss Maffei",
    modelo: "KM 2700-4",
    numeroSerie: "SN-0758974",
    ano: 2015,
    localizacao: "Injeção",
    tipo: "Injetora",
    limpeza: new Date(2026, 2, 25),
  },
] as const;

async function main() {
  for (const target of TARGETS) {
    const equipment = await prisma.equipamento.findUnique({
      where: { qrCode: target.qrCode },
    });

    if (!equipment) {
      console.log(`Não encontrado: ${target.qrCode}`);
      continue;
    }

    const updated = await prisma.equipamento.update({
      where: { id: equipment.id },
      data: {
        nome: target.nome,
        patrimonio: target.patrimonio,
        marca: target.marca,
        modelo: target.modelo,
        numeroSerie: target.numeroSerie,
        ano: target.ano,
        localizacao: target.localizacao,
        tipo: target.tipo,
      },
    });

    const latest = await prisma.inspecao.findFirst({
      where: { equipamentoId: updated.id },
      orderBy: { createdAt: "desc" },
    });

    if (latest) {
      await prisma.inspecao.update({
        where: { id: latest.id },
        data: { dataUltimaLimpeza: target.limpeza },
      });
    }

    console.log(
      `OK ${updated.qrCode} → ${updated.nome} | limpeza ${target.limpeza.toISOString().slice(0, 10)}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
