import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { qrRouter } from "./routes/qr";
import { metricsRouter } from "./routes/metrics";
import { logger } from "./utils/logger";

const app = express();
const PORT = parseInt(process.env.PORT || "3004", 10);

app.use(helmet());
app.use(express.json());
app.use(morgan("combined", { stream: { write: msg => logger.info(msg.trim()) } }));

app.use("/api/v1/qr", qrRouter);
app.get("/healthz", (_, res) => res.json({ status: "ok", service: "qr-service" }));
app.use("/metrics", metricsRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.message);
  res.status(err.statusCode || 500).json({ error: "Internal server error" });
});

app.listen(PORT, () => logger.info(`QR service listening on port ${PORT}`));
