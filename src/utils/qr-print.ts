import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { Equipment } from "@/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildQrPrintHtml(equipment: Equipment): string {
  const qrValue = escapeHtml(equipment.qr_code);
  const nome = escapeHtml(equipment.nome);
  const cliente = escapeHtml(equipment.cliente?.empresa ?? equipment.empresa);
  const patrimonio = escapeHtml(equipment.patrimonio);
  const local = escapeHtml(equipment.localizacao);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: Arial, sans-serif; color: #001423; }
    .grid { display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; }
    .card {
      width: 280px; border: 2px solid #1E4A73; border-radius: 16px;
      padding: 24px; text-align: center; page-break-inside: avoid;
    }
    .logo { font-size: 18px; font-weight: bold; color: #0073FF; margin-bottom: 4px; }
    .subtitle { font-size: 10px; color: #5396B7; margin-bottom: 16px; }
    .qr img { width: 180px; height: 180px; }
    .code { font-size: 24px; font-weight: bold; margin-top: 12px; }
    .name { font-size: 14px; font-weight: 600; margin-top: 8px; }
    .meta { font-size: 11px; color: #5396B7; margin-top: 4px; }
    .hint { font-size: 9px; color: #7CBFE0; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="grid">
    <div class="card">
      <div class="logo">DHE Hidráulicos</div>
      <div class="subtitle">Manutenção Preditiva</div>
      <div class="qr">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(equipment.qr_code)}" />
      </div>
      <div class="code">${qrValue}</div>
      <div class="name">${nome}</div>
      <div class="meta">${cliente}</div>
      <div class="meta">Patrimônio: ${patrimonio}</div>
      <div class="meta">${local}</div>
      <div class="hint">O QR contém apenas o ID. Dados vêm do banco.</div>
    </div>
  </div>
</body>
</html>`;
}

export function buildBulkQrPrintHtml(equipments: Equipment[]): string {
  const cards = equipments
    .map((eq) => {
      const qrValue = escapeHtml(eq.qr_code);
      const nome = escapeHtml(eq.nome);
      const cliente = escapeHtml(eq.cliente?.empresa ?? eq.empresa);
      const patrimonio = escapeHtml(eq.patrimonio);
      const local = escapeHtml(eq.localizacao);

      return `<div class="card">
        <div class="logo">DHE Hidráulicos</div>
        <div class="subtitle">Manutenção Preditiva</div>
        <div class="qr">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(eq.qr_code)}" />
        </div>
        <div class="code">${qrValue}</div>
        <div class="name">${nome}</div>
        <div class="meta">${cliente}</div>
        <div class="meta">Patrimônio: ${patrimonio}</div>
        <div class="meta">${local}</div>
        <div class="hint">O QR contém apenas o ID. Dados vêm do banco.</div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: Arial, sans-serif; color: #001423; }
    .grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: flex-start; }
    .card {
      width: 260px; border: 2px solid #1E4A73; border-radius: 16px;
      padding: 20px; text-align: center; page-break-inside: avoid;
    }
    .logo { font-size: 16px; font-weight: bold; color: #0073FF; }
    .subtitle { font-size: 9px; color: #5396B7; margin-bottom: 12px; }
    .qr img { width: 160px; height: 160px; }
    .code { font-size: 22px; font-weight: bold; margin-top: 10px; }
    .name { font-size: 13px; font-weight: 600; margin-top: 6px; }
    .meta { font-size: 10px; color: #5396B7; margin-top: 3px; }
    .hint { font-size: 8px; color: #7CBFE0; margin-top: 12px; }
  </style>
</head>
<body><div class="grid">${cards}</div></body>
</html>`;
}

export async function printQrPdf(html: string): Promise<void> {
  await Print.printAsync({ html });
}

export async function shareQrPdf(html: string, filename: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: filename,
      UTI: "com.adobe.pdf",
    });
  }
}
