/**
 * Ajusta QR Codes e última limpeza dos equipamentos KM 2700.
 * Uso (na VPS, pasta server):
 *   npx tsx scripts/set-km2700-limpeza.ts
 * ou via API já atualizada com suporte a qr_code customizado.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGETS = [
  {
    nome: "KM 2700-4",
    patrimonio: "KM-2700-4",
    qrCode: "KM 2700-4",
    limpeza: new Date(2026, 2, 25),
  },
  {
    nome: "KM 2700-3",
    patrimonio: "KM-2700-3",
    qrCode: "KM 2700-3",
    limpeza: new Date(2026, 2, 30),
  },
] as const;

async function main() {
  for (const target of TARGETS) {
    const equipment = await prisma.equipamento.findFirst({
      where: {
        OR: [
          { nome: target.nome },
          { patrimonio: target.patrimonio },
          { qrCode: target.qrCode },
        ],
      },
    });

    if (!equipment) {
      console.log(`Não encontrado: ${target.nome}`);
      continue;
    }

    const updated = await prisma.equipamento.update({
      where: { id: equipment.id },
      data: {
        qrCode: target.qrCode,
        nome: target.nome,
        patrimonio: target.patrimonio,
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
      `OK ${updated.qrCode} → limpeza ${target.limpeza.toISOString().slice(0, 10)}`
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
