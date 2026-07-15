import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { urlRouter } from "./routes/url";
import { metricsRouter } from "./routes/metrics";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

const app = express();
const PORT = parseInt(process.env.PORT || "3002", 10);

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(morgan("combined", { stream: { write: msg => logger.info(msg.trim()) } }));

app.use("/api/v1/urls", urlRouter);
app.get("/healthz", (_, res) => res.json({ status: "ok", service: "url-service" }));
app.use("/metrics", metricsRouter);

app.use(errorHandler);

app.listen(PORT, () => logger.info(`URL service listening on port ${PORT}`));
