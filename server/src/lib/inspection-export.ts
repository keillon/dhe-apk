import type { Prisma } from "@prisma/client";

const CONTAMINATION_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export type InspectionExportRow = {
  id: string;
  createdAt: Date;
  nivelOleo: number;
  contaminacaoOleo: string;
  dataUltimaLimpeza: Date | null;
  complemento: string | null;
  tecnico: { nome: string };
  equipamento: {
    nome: string;
    qrCode: string;
    patrimonio: string;
    localizacao: string;
    empresa: string;
    cliente?: { empresa: string } | null;
  };
  _count?: { fotos: number };
  assinatura?: { url: string } | null;
};

export function buildInspectionExportWhere(query: {
  tecnico_id?: string;
  contaminacao?: string;
  period?: string;
}): Prisma.InspecaoWhereInput {
  const where: Prisma.InspecaoWhereInput = {};

  if (query.tecnico_id && query.tecnico_id !== "all") {
    where.tecnicoId = query.tecnico_id;
  }

  if (query.contaminacao && query.contaminacao !== "all") {
    where.contaminacaoOleo = query.contaminacao as "baixa" | "media" | "alta";
  }

  if (query.period === "7d" || query.period === "30d" || query.period === "90d") {
    const days = Number(query.period.replace("d", ""));
    where.createdAt = {
      gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    };
  }

  return where;
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildInspectionsCsv(inspections: InspectionExportRow[]): string {
  const header = [
    "ID",
    "Data",
    "Equipamento",
    "QR Code",
    "Patrimônio",
    "Localização",
    "Cliente",
    "Técnico",
    "Nível óleo (%)",
    "Contaminação",
    "Última limpeza",
    "Fotos",
    "Assinatura",
    "Observações",
  ].join(",");

  const rows = inspections.map((inspection) => {
    const values = [
      inspection.id,
      inspection.createdAt.toISOString(),
      inspection.equipamento.nome,
      inspection.equipamento.qrCode,
      inspection.equipamento.patrimonio,
      inspection.equipamento.localizacao,
      inspection.equipamento.cliente?.empresa ?? inspection.equipamento.empresa,
      inspection.tecnico.nome,
      String(inspection.nivelOleo),
      CONTAMINATION_LABEL[inspection.contaminacaoOleo] ?? inspection.contaminacaoOleo,
      inspection.dataUltimaLimpeza
        ? inspection.dataUltimaLimpeza.toISOString().split("T")[0]
        : "",
      String(inspection._count?.fotos ?? 0),
      inspection.assinatura?.url ? "Sim" : "Não",
      inspection.complemento ?? "",
    ];
    return values.map((value) => csvEscape(String(value))).join(",");
  });

  // BOM para Excel abrir acentuação corretamente
  return `\uFEFF${[header, ...rows].join("\r\n")}`;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** SpreadsheetML (.xls) aberto nativamente pelo Excel. */
export function buildInspectionsExcelXml(inspections: InspectionExportRow[]): string {
  const headers = [
    "ID",
    "Data",
    "Equipamento",
    "QR Code",
    "Patrimônio",
    "Localização",
    "Cliente",
    "Técnico",
    "Nível óleo (%)",
    "Contaminação",
    "Última limpeza",
    "Fotos",
    "Assinatura",
    "Observações",
  ];

  const headerRow = headers
    .map((h) => `<Cell><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`)
    .join("");

  const dataRows = inspections
    .map((inspection) => {
      const cells = [
        inspection.id,
        inspection.createdAt.toISOString(),
        inspection.equipamento.nome,
        inspection.equipamento.qrCode,
        inspection.equipamento.patrimonio,
        inspection.equipamento.localizacao,
        inspection.equipamento.cliente?.empresa ?? inspection.equipamento.empresa,
        inspection.tecnico.nome,
        String(inspection.nivelOleo),
        CONTAMINATION_LABEL[inspection.contaminacaoOleo] ?? inspection.contaminacaoOleo,
        inspection.dataUltimaLimpeza
          ? inspection.dataUltimaLimpeza.toISOString().split("T")[0]
          : "",
        String(inspection._count?.fotos ?? 0),
        inspection.assinatura?.url ? "Sim" : "Não",
        inspection.complemento ?? "",
      ];

      return `<Row>${cells
        .map((value) => `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`)
        .join("")}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Inspeções">
  <Table>
   <Row>${headerRow}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}
