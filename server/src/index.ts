import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import { ensureDefaultUsers } from "./lib/ensure-users";
import { ensureDefaultChecklist } from "./lib/ensure-checklist";
import { getUploadRoot } from "./lib/media-storage";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { equipmentsRouter } from "./routes/equipments";
import { clientsRouter } from "./routes/clients";
import { inspectionsRouter } from "./routes/inspections";
import { notificationsRouter } from "./routes/notifications";
import { pushRouter } from "./routes/push";
import { dailyRoutesRouter } from "./routes/daily-routes";
import { checklistsRouter } from "./routes/checklists";
import { auditRouter, maintenanceRouter } from "./routes/features";
import { updatesRouter } from "./routes/updates";
import { appRouter } from "./routes/app";
import { ensureUpdatesDir } from "./lib/updates-storage";

const app = express();
const port = Number(process.env.PORT ?? 4002);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api/media", express.static(getUploadRoot(), { maxAge: "7d" }));
app.use("/api/updates", updatesRouter);
app.use("/api/app", appRouter);
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      service: "dhe-api",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check DB error:", error);
    res.status(503).json({
      status: "error",
      service: "dhe-api",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/equipments", equipmentsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/inspections", inspectionsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/push", pushRouter);
app.use("/api/daily-routes", dailyRoutesRouter);
app.use("/api/checklists", checklistsRouter);
app.use("/api/audit", auditRouter);
app.use("/api/maintenance", maintenanceRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Não foi possível concluir a operação. Tente novamente." });
  }
);

app.listen(port, "0.0.0.0", async () => {
  try {
    await ensureUpdatesDir();
    await ensureDefaultUsers();
    console.log("Usuários padrão verificados (admin e técnico).");
    await ensureDefaultChecklist();
    console.log("Checklist padrão verificado.");
  } catch (error) {
    console.error("Erro ao garantir dados padrão:", error);
  }

  console.log(`DHE API rodando na porta ${port}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});
