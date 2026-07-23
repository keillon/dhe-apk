import { Router, type Request } from "express";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import FormData from "form-data";
import multer from "multer";
import AdmZip from "adm-zip";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import {
  ensureUpdatesDir,
  getAssetMetadata,
  getContentType,
  getExpoConfig,
  getLatestUpdateBundlePath,
  getMetadata,
  getUpdatesRoot,
  hashToUuid,
} from "../lib/updates-storage";

export const updatesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

function resolvePlatform(req: Request): "ios" | "android" | null {
  const header = req.header("expo-platform");
  const query = req.query.platform;
  const platform = String(header ?? query ?? "");
  return platform === "ios" || platform === "android" ? platform : null;
}

function resolveRuntimeVersion(req: Request): string | null {
  const header = req.header("expo-runtime-version");
  const query = req.query["runtime-version"] ?? req.query.runtimeVersion;
  const value = String(header ?? query ?? "");
  return value || null;
}

updatesRouter.get("/manifest", async (req, res) => {
  try {
    const protocolVersion = Number(req.headers["expo-protocol-version"] ?? 0);
    const platform = resolvePlatform(req);
    const runtimeVersion = resolveRuntimeVersion(req);

    if (!platform) {
      res.status(400).json({ error: "Plataforma inválida. Use ios ou android." });
      return;
    }

    if (!runtimeVersion) {
      res.status(400).json({ error: "runtimeVersion não informado." });
      return;
    }

    const updateBundlePath = await getLatestUpdateBundlePath(runtimeVersion);
    const { metadataJson, createdAt, id } = await getMetadata(updateBundlePath);
    const platformMeta = metadataJson.fileMetadata[platform];

    if (!platformMeta) {
      res.status(404).json({ error: `Sem bundle para plataforma ${platform}.` });
      return;
    }

    const manifest = {
      id: hashToUuid(id),
      createdAt,
      runtimeVersion,
      assets: await Promise.all(
        platformMeta.assets.map((asset) =>
          getAssetMetadata({
            updateBundlePath,
            filePath: asset.path,
            ext: asset.ext,
            isLaunchAsset: false,
            runtimeVersion,
            platform,
          })
        )
      ),
      launchAsset: await getAssetMetadata({
        updateBundlePath,
        filePath: platformMeta.bundle,
        ext: null,
        isLaunchAsset: true,
        runtimeVersion,
        platform,
      }),
      metadata: {},
      extra: {
        expoClient: await getExpoConfig(updateBundlePath),
      },
    };

    const form = new FormData();
    form.append("manifest", JSON.stringify(manifest), {
      contentType: "application/json",
      header: {
        "content-type": "application/json; charset=utf-8",
      },
    });

    res.status(200);
    res.setHeader("expo-protocol-version", String(protocolVersion));
    res.setHeader("expo-sfv-version", "0");
    res.setHeader("cache-control", "private, max-age=0");
    res.setHeader("content-type", `multipart/mixed; boundary=${form.getBoundary()}`);
    res.end(form.getBuffer());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao servir manifesto";
    console.error("Erro no manifesto OTA:", error);
    res.status(404).json({ error: message });
  }
});

updatesRouter.get("/assets", async (req, res) => {
  try {
    const assetName = String(req.query.asset ?? "");
    const platform = resolvePlatform(req);
    const runtimeVersion = resolveRuntimeVersion(req);

    if (!assetName || !platform || !runtimeVersion) {
      res.status(400).json({ error: "Parâmetros asset, platform e runtimeVersion são obrigatórios." });
      return;
    }

    if (assetName.includes("..") || path.isAbsolute(assetName)) {
      res.status(400).json({ error: "Asset inválido." });
      return;
    }

    const updateBundlePath = await getLatestUpdateBundlePath(runtimeVersion);
    const absoluteAsset = path.resolve(updateBundlePath, assetName);
    if (!absoluteAsset.startsWith(path.resolve(updateBundlePath))) {
      res.status(400).json({ error: "Asset fora do diretório permitido." });
      return;
    }

    if (!fs.existsSync(absoluteAsset)) {
      res.status(404).json({ error: `Asset não encontrado: ${assetName}` });
      return;
    }

    const { metadataJson } = await getMetadata(updateBundlePath);
    const platformMeta = metadataJson.fileMetadata[platform];
    const isLaunchAsset = platformMeta?.bundle === assetName.replace(/\\/g, "/");
    const assetMeta = platformMeta?.assets.find((item) => item.path === assetName.replace(/\\/g, "/"));

    const buffer = await fsp.readFile(absoluteAsset);
    res.status(200);
    res.setHeader(
      "content-type",
      isLaunchAsset ? "application/javascript" : getContentType(assetMeta?.ext)
    );
    res.end(buffer);
  } catch (error) {
    console.error("Erro ao servir asset OTA:", error);
    res.status(500).json({ error: "Erro ao servir asset" });
  }
});

updatesRouter.get("/status", async (_req, res) => {
  try {
    await ensureUpdatesDir();
    const root = getUpdatesRoot();
    const runtimes = await fsp.readdir(root).catch(() => []);
    const summary: Array<{ runtimeVersion: string; latest?: string }> = [];

    for (const runtimeVersion of runtimes) {
      try {
        const latest = await getLatestUpdateBundlePath(runtimeVersion);
        summary.push({
          runtimeVersion,
          latest: path.basename(latest),
        });
      } catch {
        summary.push({ runtimeVersion });
      }
    }

    res.json({ ok: true, updatesRoot: root, runtimes: summary });
  } catch (error) {
    console.error("Erro no status OTA:", error);
    res.status(500).json({ error: "Erro ao listar atualizações" });
  }
});

updatesRouter.post(
  "/publish",
  authMiddleware,
  adminMiddleware,
  upload.single("bundle"),
  async (req, res) => {
    try {
      const runtimeVersion = String(req.body.runtimeVersion ?? "").trim();
      if (!runtimeVersion) {
        res.status(400).json({ error: "runtimeVersion é obrigatório." });
        return;
      }

      if (!req.file?.buffer?.length) {
        res.status(400).json({ error: "Envie o ZIP do export em 'bundle'." });
        return;
      }

      await ensureUpdatesDir();
      const updateId = String(Date.now());
      const targetDir = path.join(getUpdatesRoot(), runtimeVersion, updateId);
      await fsp.mkdir(targetDir, { recursive: true });

      const zip = new AdmZip(req.file.buffer);
      zip.extractAllTo(targetDir, true);

      const metadataPath = path.join(targetDir, "metadata.json");
      if (!fs.existsSync(metadataPath)) {
        // Alguns exports colocam arquivos na raiz do zip; tenta achar metadata um nível abaixo.
        const children = await fsp.readdir(targetDir);
        for (const child of children) {
          const nested = path.join(targetDir, child, "metadata.json");
          if (fs.existsSync(nested)) {
            const nestedDir = path.join(targetDir, child);
            const nestedFiles = await fsp.readdir(nestedDir);
            for (const file of nestedFiles) {
              await fsp.rename(path.join(nestedDir, file), path.join(targetDir, file));
            }
            await fsp.rm(nestedDir, { recursive: true, force: true });
            break;
          }
        }
      }

      if (!fs.existsSync(path.join(targetDir, "metadata.json"))) {
        await fsp.rm(targetDir, { recursive: true, force: true });
        res.status(400).json({
          error: "ZIP inválido: metadata.json não encontrado (rode npx expo export).",
        });
        return;
      }

      if (!fs.existsSync(path.join(targetDir, "expoConfig.json")) && req.body.expoConfig) {
        await fsp.writeFile(
          path.join(targetDir, "expoConfig.json"),
          String(req.body.expoConfig),
          "utf8"
        );
      }

      res.json({
        success: true,
        runtimeVersion,
        updateId,
        path: `${runtimeVersion}/${updateId}`,
        message: "Atualização publicada. Os apps baixam no próximo open.",
      });
    } catch (error) {
      console.error("Erro ao publicar OTA:", error);
      res.status(500).json({ error: "Erro ao publicar atualização" });
    }
  }
);
