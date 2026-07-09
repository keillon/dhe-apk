import { prisma } from "./prisma";

export async function generateNextQrCode(): Promise<string> {
  const equipments = await prisma.equipamento.findMany({
    where: { qrCode: { startsWith: "DHE-" } },
    select: { qrCode: true },
  });

  const numbers = equipments
    .map((equipment) => Number.parseInt(equipment.qrCode.replace("DHE-", ""), 10))
    .filter((value) => !Number.isNaN(value));

  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `DHE-${String(next).padStart(4, "0")}`;
}

export async function previewNextQrCode(): Promise<string> {
  return generateNextQrCode();
}
