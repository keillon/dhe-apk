export function normalizeSignatureDataUrl(signature: string): string {
  const trimmed = signature.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return trimmed;
  return `data:image/png;base64,${trimmed}`;
}
