import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const DEFAULT_CHECKLIST_ITENS = [
  { key: "vazamentos", label: "Vazamentos", obrigatorio: false },
  { key: "mangueiras", label: "Mangueiras", obrigatorio: false },
  { key: "cilindros", label: "Cilindros", obrigatorio: false },
  { key: "motor", label: "Motor", obrigatorio: false },
  { key: "bomba", label: "Bomba", obrigatorio: false },
  { key: "pressao", label: "Pressão", obrigatorio: false },
  { key: "temperatura", label: "Temperatura", obrigatorio: false },
  { key: "filtros", label: "Filtros", obrigatorio: false },
  { key: "ruidos", label: "Ruídos", obrigatorio: false },
  { key: "acoplamentos", label: "Acoplamentos", obrigatorio: false },
  { key: "analise_oleo", label: "Análise de óleo", obrigatorio: false },
  { key: "filtragem_oleo", label: "Filtragem de óleo", obrigatorio: false },
  { key: "limpeza_reservatorio", label: "Limpeza de Reservatório", obrigatorio: false },
  { key: "substituicao_filtros", label: "Substituição de filtros", obrigatorio: false },
] as const;

export async function ensureDefaultChecklist(): Promise<void> {
  await prisma.checklistTemplate.upsert({
    where: { tipo: "geral" },
    create: {
      tipo: "geral",
      nome: "Checklist geral",
      itens: DEFAULT_CHECKLIST_ITENS as unknown as Prisma.InputJsonValue,
    },
    update: {
      nome: "Checklist geral",
      itens: DEFAULT_CHECKLIST_ITENS as unknown as Prisma.InputJsonValue,
    },
  });
}
