import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/auth";
import { apiKeyRouter } from "./routes/apiKey";
import { metricsRouter } from "./routes/metrics";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(morgan("combined", { stream: { write: msg => logger.info(msg.trim()) } }));

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/auth/keys", apiKeyRouter);
app.get("/healthz", (_, res) => res.json({ status: "ok", service: "auth-service" }));
app.use("/metrics", metricsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Auth service listening on port ${PORT}`);
});

export default app;
