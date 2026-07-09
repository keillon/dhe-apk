import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const apiUrl = process.env.DHE_API_HOST
    ? `https://${process.env.DHE_API_HOST}`
    : `http://localhost:${process.env.PORT ?? 4002}`;

  console.log("=== Teste de conexão DHE ===");
  console.log(`DATABASE_URL: ${maskDatabaseUrl(process.env.DATABASE_URL ?? "")}`);

  await prisma.$queryRaw`SELECT 1`;
  console.log("✓ Banco PostgreSQL conectado");

  const [users, equipments, inspections] = await Promise.all([
    prisma.usuario.count(),
    prisma.equipamento.count(),
    prisma.inspecao.count(),
  ]);

  console.log(`✓ Usuários: ${users}`);
  console.log(`✓ Equipamentos: ${equipments}`);
  console.log(`✓ Inspeções: ${inspections}`);

  try {
    const health = await fetch(`${apiUrl}/health`);
    const body = await health.text();
    console.log(`✓ API ${apiUrl}/health → ${health.status} ${body}`);
  } catch (error) {
    console.error(`✗ API indisponível em ${apiUrl}`);
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

function maskDatabaseUrl(url: string): string {
  return url.replace(/:([^:@]+)@/, ":***@");
}

main()
  .catch((error) => {
    console.error("✗ Falha na conexão com o banco:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
