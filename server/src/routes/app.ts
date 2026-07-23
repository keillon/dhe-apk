import { Router } from "express";
import fs from "node:fs";
import multer from "multer";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import { prisma } from "../lib/prisma";
import { sendExpoPushMessages } from "../lib/expo-push";
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

async function notifyAllDevicesAboutAppUpdate(meta: {
  version: string;
  versionCode: number;
  notes?: string;
  apkUrl: string;
}): Promise<{ sent: number; errors: string[] }> {
  const tokens = await prisma.pushToken.findMany({ select: { token: true } });
  if (tokens.length === 0) {
    return { sent: 0, errors: ["Nenhum token push registrado."] };
  }

  const title = `Nova versão ${meta.version}`;
  const body =
    meta.notes?.trim() ||
    "Atualização do DHE Hidráulicos disponível. Toque para baixar e instalar.";

  const tickets = await sendExpoPushMessages(
    tokens.map((item) => item.token),
    title,
    body,
    {
      type: "app_update",
      version: meta.version,
      versionCode: meta.versionCode,
      apkUrl: meta.apkUrl,
      url: meta.apkUrl,
    }
  );

  const errors = tickets
    .filter((ticket) => ticket.status === "error")
    .map((ticket) => ticket.message ?? ticket.details?.error ?? "Erro desconhecido");

  return { sent: tickets.length, errors };
}

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

appRouter.post("/notify", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const meta = await readAppReleaseMeta();
    if (!meta || !appReleaseApkExists(meta)) {
      res.status(404).json({ error: "Publique um APK antes de notificar." });
      return;
    }

    const payload = buildAppVersionPayload(meta);
    const result = await notifyAllDevicesAboutAppUpdate({
      version: payload.version,
      versionCode: payload.versionCode,
      notes: payload.notes,
      apkUrl: payload.apkUrl,
    });

    res.json({
      success: result.errors.length === 0,
      ...result,
      version: payload.version,
      versionCode: payload.versionCode,
    });
  } catch (error) {
    console.error("Erro ao notificar atualização:", error);
    res.status(500).json({ error: "Erro ao notificar aparelhos" });
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
      const notify =
        req.body.notify === undefined ||
        req.body.notify === "1" ||
        req.body.notify === "true" ||
        req.body.notify === true;

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

      const payload = buildAppVersionPayload(meta);
      let notifyResult = { sent: 0, errors: [] as string[] };

      if (notify) {
        notifyResult = await notifyAllDevicesAboutAppUpdate({
          version: payload.version,
          versionCode: payload.versionCode,
          notes: payload.notes,
          apkUrl: payload.apkUrl,
        });
      }

      res.json({
        success: true,
        ...payload,
        notified: notify,
        pushSent: notifyResult.sent,
        pushErrors: notifyResult.errors,
        message: notify
          ? `APK publicado e push enviado para ${notifyResult.sent} dispositivo(s).`
          : "APK publicado sem notificação push.",
      });
    } catch (error) {
      console.error("Erro ao publicar APK:", error);
      res.status(500).json({ error: "Erro ao publicar APK" });
    }
  }
);
