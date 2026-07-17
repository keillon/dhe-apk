import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import QRCode from "qrcode";
import type { Equipment } from "@/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function buildQrSvgMarkup(value: string, size: number): Promise<string> {
  const svg = await QRCode.toString(value, {
    type: "svg",
    width: size,
    margin: 1,
    color: {
      dark: "#001423",
      light: "#FFFFFF",
    },
  });
  return svg.replace("<svg", `<svg width="${size}" height="${size}"`);
}

async function buildQrCardHtml(equipment: Equipment, size: number): Promise<string> {
  const qrMarkup = await buildQrSvgMarkup(equipment.qr_code, size);
  const qrValue = escapeHtml(equipment.qr_code);
  const nome = escapeHtml(equipment.nome);
  const cliente = escapeHtml(equipment.cliente?.empresa ?? equipment.empresa);
  const patrimonio = escapeHtml(equipment.patrimonio);
  const local = escapeHtml(equipment.localizacao);

  return `<div class="card">
    <div class="logo">DHE Componentes Hidráulicos</div>
    <div class="subtitle">Manutenção Preditiva</div>
    <div class="qr">${qrMarkup}</div>
    <div class="code">${qrValue}</div>
    <div class="name">${nome}</div>
    <div class="meta">${cliente}</div>
    <div class="meta">Patrimônio: ${patrimonio}</div>
    <div class="meta">${local}</div>
    <div class="hint">Escaneie para abrir a ficha do equipamento</div>
  </div>`;
}

export async function buildQrPrintHtml(equipment: Equipment): Promise<string> {
  const card = await buildQrCardHtml(equipment, 180);

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
    .logo { font-size: 16px; font-weight: bold; color: #0172FE; margin-bottom: 4px; }
    .subtitle { font-size: 10px; color: #5396B7; margin-bottom: 16px; }
    .qr { display: flex; justify-content: center; }
    .code { font-size: 24px; font-weight: bold; margin-top: 12px; }
    .name { font-size: 14px; font-weight: 600; margin-top: 8px; }
    .meta { font-size: 11px; color: #5396B7; margin-top: 4px; }
    .hint { font-size: 9px; color: #7CBFE0; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="grid">${card}</div>
</body>
</html>`;
}

export async function buildBulkQrPrintHtml(equipments: Equipment[]): Promise<string> {
  const cards = await Promise.all(equipments.map((eq) => buildQrCardHtml(eq, 160)));

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
    .logo { font-size: 14px; font-weight: bold; color: #0172FE; }
    .subtitle { font-size: 9px; color: #5396B7; margin-bottom: 12px; }
    .qr { display: flex; justify-content: center; }
    .code { font-size: 22px; font-weight: bold; margin-top: 10px; }
    .name { font-size: 13px; font-weight: 600; margin-top: 6px; }
    .meta { font-size: 10px; color: #5396B7; margin-top: 3px; }
    .hint { font-size: 8px; color: #7CBFE0; margin-top: 12px; }
  </style>
</head>
<body><div class="grid">${cards.join("")}</div></body>
</html>`;
}

export async function printQrPdf(html: string): Promise<void> {
  await Print.printAsync({ html });
}

async function buildShareablePdfUri(html: string, filename: string): Promise<string> {
  const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });

  if (Platform.OS === "android" && base64) {
    const safeName = filename.replace(/[^a-zA-Z0-9-_]/g, "_");
    const destination = `${FileSystem.cacheDirectory}${safeName}-${Date.now()}.pdf`;

    await FileSystem.writeAsStringAsync(destination, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return destination;
  }

  return uri;
}

export async function shareQrPdf(html: string, filename: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Compartilhamento não disponível neste dispositivo.");
  }

  const shareUri = await buildShareablePdfUri(html, filename);

  await Sharing.shareAsync(shareUri, {
    mimeType: "application/pdf",
    dialogTitle: filename,
    UTI: "com.adobe.pdf",
  });
}
