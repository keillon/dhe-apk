import { Router } from "express";
import fs from "node:fs";
import multer from "multer";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import {
  appReleaseApkExists,
  buildAppVersionPayload,
  getAppReleaseApkPath,
  readAppReleaseMeta,
  writeAppRelease,
} from "../lib/app-release";

export const appRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 220 * 1024 * 1024 },
});

appRouter.get("/version", async (_req, res) => {
  try {
    const meta = await readAppReleaseMeta();
    if (!meta || !appReleaseApkExists(meta)) {
      res.status(404).json({ error: "Nenhuma versão de APK publicada." });
      return;
    }

    res.json(buildAppVersionPayload(meta));
  } catch (error) {
    console.error("Erro ao ler versão do app:", error);
    res.status(500).json({ error: "Erro ao consultar versão" });
  }
});

appRouter.get("/download", async (_req, res) => {
  try {
    const meta = await readAppReleaseMeta();
    if (!meta || !appReleaseApkExists(meta)) {
      res.status(404).json({ error: "APK não encontrado." });
      return;
    }

    const apkPath = getAppReleaseApkPath(meta.apkFileName);
    const stat = fs.statSync(apkPath);

    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Length", String(stat.size));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="DHE-Hidraulicos-${meta.version}.apk"`
    );
    fs.createReadStream(apkPath).pipe(res);
  } catch (error) {
    console.error("Erro ao baixar APK:", error);
    res.status(500).json({ error: "Erro ao baixar APK" });
  }
});

appRouter.post(
  "/publish",
  authMiddleware,
  adminMiddleware,
  upload.single("apk"),
  async (req, res) => {
    try {
      const version = String(req.body.version ?? "").trim();
      const versionCode = Number(req.body.versionCode);
      const notes = String(req.body.notes ?? "").trim() || undefined;

      if (!version || !Number.isFinite(versionCode) || versionCode < 1) {
        res.status(400).json({ error: "version e versionCode são obrigatórios." });
        return;
      }

      if (!req.file?.buffer?.length) {
        res.status(400).json({ error: "Envie o arquivo APK no campo 'apk'." });
        return;
      }

      const meta = await writeAppRelease({
        version,
        versionCode,
        notes,
        apkBuffer: req.file.buffer,
      });

      res.json({
        success: true,
        ...buildAppVersionPayload(meta),
        message: "APK publicado. Os aparelhos podem baixar e instalar pelo app.",
      });
    } catch (error) {
      console.error("Erro ao publicar APK:", error);
      res.status(500).json({ error: "Erro ao publicar APK" });
    }
  }
);
