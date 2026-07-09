import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export function getUploadRoot(): string {
  return UPLOAD_ROOT;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function persistImageData(url: string, subdir: string): Promise<string> {
  if (!url.startsWith("data:")) {
    return url;
  }

  const match = url.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return url;

  const mime = match[1];
  const base64 = match[2];
  const ext = mime.includes("png") ? "png" : "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const folder = path.join(UPLOAD_ROOT, subdir);
  await ensureDir(folder);

  const filePath = path.join(folder, fileName);
  await fs.writeFile(filePath, Buffer.from(base64, "base64"));

  const publicPath = path.posix.join("/api/media", subdir.replace(/\\/g, "/"), fileName);
  return publicPath;
}

export async function persistInspectionMedia(
  inspecaoId: string,
  fotos: Array<{ tipo: "antes" | "depois"; url: string }>,
  assinaturaUrl: string
): Promise<{
  fotos: Array<{ tipo: "antes" | "depois"; url: string }>;
  assinaturaUrl: string;
}> {
  const baseDir = `inspections/${inspecaoId}`;

  const persistedFotos = await Promise.all(
    fotos.map(async (foto) => ({
      tipo: foto.tipo,
      url: await persistImageData(foto.url, `${baseDir}/fotos`),
    }))
  );

  const persistedSignature = await persistImageData(assinaturaUrl, `${baseDir}/assinatura`);

  return {
    fotos: persistedFotos,
    assinaturaUrl: persistedSignature,
  };
}
