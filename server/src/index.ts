import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { equipmentsRouter } from "./routes/equipments";
import { clientsRouter } from "./routes/clients";
import { inspectionsRouter } from "./routes/inspections";
import { notificationsRouter } from "./routes/notifications";

const app = express();
const port = Number(process.env.PORT ?? 4002);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "dhe-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/equipments", equipmentsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/inspections", inspectionsRouter);
app.use("/api/notifications", notificationsRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
);

app.listen(port, "0.0.0.0", () => {
  console.log(`DHE API rodando na porta ${port}`);
});
