import { Router } from "express";
import client from "prom-client";

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const metricsRouter = Router();
metricsRouter.get("/", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
