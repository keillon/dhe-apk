import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const MIME_BY_EXT: Record<string, string> = {
  js: "application/javascript",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
  mp4: "video/mp4",
  html: "text/html",
};

export function getUpdatesRoot(): string {
  return process.env.UPDATES_DIR || path.join(process.cwd(), "updates");
}

export function getPublicApiBase(): string {
  return (process.env.PUBLIC_API_URL || "http://195.35.40.86:8090").replace(/\/$/, "");
}

export function getContentType(ext: string | null | undefined): string {
  if (!ext) return "application/octet-stream";
  const normalized = ext.replace(/^\./, "").toLowerCase();
  return MIME_BY_EXT[normalized] ?? "application/octet-stream";
}

function createHash(file: Buffer, algorithm: string, encoding: crypto.BinaryToTextEncoding) {
  return crypto.createHash(algorithm).update(file).digest(encoding);
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function hashToUuid(hash: string): string {
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export async function getLatestUpdateBundlePath(runtimeVersion: string): Promise<string> {
  const runtimeDir = path.join(getUpdatesRoot(), runtimeVersion);
  let entries: string[];
  try {
    entries = await fs.readdir(runtimeDir);
  } catch {
    throw new Error(`Nenhuma atualização para runtime ${runtimeVersion}`);
  }

  const directories: string[] = [];
  for (const entry of entries) {
    const full = path.join(runtimeDir, entry);
    const stat = await fs.stat(full);
    if (stat.isDirectory()) directories.push(entry);
  }

  if (directories.length === 0) {
    throw new Error(`Nenhuma atualização para runtime ${runtimeVersion}`);
  }

  directories.sort((a, b) => Number(b) - Number(a) || b.localeCompare(a));
  return path.join(runtimeDir, directories[0]);
}

export async function getMetadata(updateBundlePath: string) {
  const metadataPath = path.join(updateBundlePath, "metadata.json");
  const raw = await fs.readFile(metadataPath, "utf8");
  const metadataJson = JSON.parse(raw) as {
    fileMetadata: Record<
      string,
      {
        bundle: string;
        assets: Array<{ path: string; ext: string }>;
      }
    >;
  };

  const id = createHash(Buffer.from(raw), "sha256", "hex");
  const createdAt = new Date((await fs.stat(metadataPath)).mtime).toISOString();

  return { metadataJson, id, createdAt };
}

export async function getExpoConfig(updateBundlePath: string) {
  try {
    const raw = await fs.readFile(path.join(updateBundlePath, "expoConfig.json"), "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function getAssetMetadata(args: {
  updateBundlePath: string;
  filePath: string;
  ext: string | null;
  isLaunchAsset: boolean;
  runtimeVersion: string;
  platform: string;
}) {
  const assetFilePath = path.join(args.updateBundlePath, args.filePath);
  const asset = await fs.readFile(assetFilePath);
  const assetHash = toBase64Url(createHash(asset, "sha256", "base64"));
  const key = createHash(asset, "md5", "hex");
  const keyExtensionSuffix = args.isLaunchAsset ? "bundle" : args.ext ?? "bin";
  const contentType = args.isLaunchAsset
    ? "application/javascript"
    : getContentType(args.ext);

  const relativeAsset = args.filePath.replace(/\\/g, "/");
  const url =
    `${getPublicApiBase()}/api/updates/assets` +
    `?asset=${encodeURIComponent(relativeAsset)}` +
    `&runtimeVersion=${encodeURIComponent(args.runtimeVersion)}` +
    `&platform=${encodeURIComponent(args.platform)}`;

  return {
    hash: assetHash,
    key,
    fileExtension: `.${keyExtensionSuffix}`,
    contentType,
    url,
  };
}

export async function ensureUpdatesDir(): Promise<void> {
  await fs.mkdir(getUpdatesRoot(), { recursive: true });
}
