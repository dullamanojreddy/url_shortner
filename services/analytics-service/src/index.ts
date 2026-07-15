import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { analyticsRouter } from "./routes/analytics";
import { metricsRouter } from "./routes/metrics";
import { startConsumer } from "./consumer/clickConsumer";
import { logger } from "./utils/logger";

const app = express();
const PORT = parseInt(process.env.PORT || "3003", 10);

app.use(helmet());
app.use(express.json());
app.use(morgan("combined", { stream: { write: msg => logger.info(msg.trim()) } }));

app.use("/api/v1/analytics", analyticsRouter);
app.get("/healthz", (_, res) => res.json({ status: "ok", service: "analytics-service" }));
app.use("/metrics", metricsRouter);

async function start() {
  await startConsumer();
  app.listen(PORT, () => logger.info(`Analytics service listening on port ${PORT}`));
}

start().catch(err => {
  logger.error("Failed to start analytics service", err);
  process.exit(1);
});
