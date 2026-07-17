import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import type { Inspection } from "@/types";
import {
  formatDate,
  formatDateTime,
  getContaminationLabel,
  CHECKLIST_LABELS,
} from "@/utils";
import { resolveMediaUrl } from "@/utils/media-url";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getChecklistLabel(key: string): string {
  return CHECKLIST_LABELS[key as keyof typeof CHECKLIST_LABELS] ?? key;
}

async function toEmbeddableImage(url?: string | null): Promise<string | null> {
  if (!url) return null;
  const resolved = resolveMediaUrl(url);
  if (!resolved) return null;
  if (resolved.startsWith("data:")) return resolved;

  try {
    const target = `${FileSystem.cacheDirectory}pdf-media-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.img`;
    const downloaded = await FileSystem.downloadAsync(resolved, target);
    const base64 = await FileSystem.readAsStringAsync(downloaded.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const lower = resolved.toLowerCase();
    const mime = lower.includes(".png")
      ? "image/png"
      : lower.includes(".webp")
        ? "image/webp"
        : "image/jpeg";
    return `data:${mime};base64,${base64}`;
  } catch {
    return resolved.startsWith("http") ? resolved : null;
  }
}

export async function buildInspectionReportHtml(inspection: Inspection): Promise<string> {
  const equipmentName = escapeHtml(inspection.equipamento?.nome ?? "Equipamento");
  const qrCode = escapeHtml(inspection.equipamento?.qr_code ?? "—");
  const patrimonio = escapeHtml(inspection.equipamento?.patrimonio ?? "—");
  const localizacao = escapeHtml(inspection.equipamento?.localizacao ?? "—");
  const cliente = escapeHtml(
    inspection.equipamento?.cliente?.empresa ?? inspection.equipamento?.empresa ?? "—"
  );
  const tecnico = escapeHtml(inspection.tecnico?.nome ?? "—");
  const complemento = inspection.complemento
    ? `<p><strong>Observações:</strong> ${escapeHtml(inspection.complemento)}</p>`
    : "";

  const checklistRows = Object.entries(inspection.checklist ?? {})
    .map(
      ([key, checked]) =>
        `<tr><td>${escapeHtml(getChecklistLabel(key))}</td><td>${checked ? "Sim" : "Não"}</td></tr>`
    )
    .join("");

  const photoBlocks: string[] = [];
  for (const foto of inspection.fotos ?? []) {
    if (foto.media_kind === "video") {
      photoBlocks.push(
        `<div class="photo"><p><strong>${foto.tipo === "antes" ? "Antes" : "Depois"}</strong> — Vídeo (não incluído no PDF)</p></div>`
      );
      continue;
    }

    const src = await toEmbeddableImage(foto.url);
    if (!src) continue;
    photoBlocks.push(
      `<div class="photo"><img src="${src}" /><p>${foto.tipo === "antes" ? "Antes" : "Depois"}</p></div>`
    );
  }

  const assinaturaSrc = await toEmbeddableImage(inspection.assinatura_url);
  const assinatura = assinaturaSrc
    ? `<div class="signature"><p><strong>Assinatura do técnico</strong></p><img src="${assinaturaSrc}" /></div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: Arial, sans-serif; color: #001423; }
    h1 { color: #0172FE; margin-bottom: 4px; }
    .meta { color: #5396B7; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #d0e4f2; padding: 8px; text-align: left; font-size: 12px; }
    th { background: #f0f8ff; }
    .photos { display: flex; flex-wrap: wrap; gap: 12px; }
    .photo img, .signature img { max-width: 180px; max-height: 180px; border-radius: 8px; }
    .section { margin-top: 24px; }
  </style>
</head>
<body>
  <h1>Relatório de Inspeção DHE</h1>
  <p class="meta">${formatDateTime(inspection.created_at)} • ${tecnico}</p>

  <div class="section">
    <p><strong>Equipamento:</strong> ${equipmentName}</p>
    <p><strong>QR Code:</strong> ${qrCode}</p>
    <p><strong>Patrimônio:</strong> ${patrimonio}</p>
    <p><strong>Localização:</strong> ${localizacao}</p>
    <p><strong>Cliente:</strong> ${cliente}</p>
    <p><strong>Nível do óleo:</strong> ${inspection.nivel_oleo}%</p>
    <p><strong>Contaminação:</strong> ${escapeHtml(getContaminationLabel(inspection.contaminacao_oleo))}</p>
    <p><strong>Última limpeza:</strong> ${escapeHtml(formatDate(inspection.data_ultima_limpeza))}</p>
    ${complemento}
  </div>

  <div class="section">
    <h2>Checklist</h2>
    <table>
      <thead><tr><th>Item</th><th>Verificado</th></tr></thead>
      <tbody>${checklistRows || "<tr><td colspan='2'>Sem itens</td></tr>"}</tbody>
    </table>
  </div>

  <div class="section photos">${photoBlocks.join("")}</div>
  ${assinatura}
</body>
</html>`;
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

export async function shareInspectionPdf(inspection: Inspection): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Compartilhamento não disponível neste dispositivo.");
  }

  const html = await buildInspectionReportHtml(inspection);
  const filename = `inspecao-${inspection.id.slice(0, 8)}`;
  const shareUri = await buildShareablePdfUri(html, filename);

  await Sharing.shareAsync(shareUri, {
    mimeType: "application/pdf",
    dialogTitle: filename,
    UTI: "com.adobe.pdf",
  });
}

export async function printInspectionPdf(inspection: Inspection): Promise<void> {
  const html = await buildInspectionReportHtml(inspection);
  await Print.printAsync({ html });
}
