import { Router } from "express";
import { register } from "../utils/metrics";


export const metricsRouter = Router();


metricsRouter.get(
  "/",
  async (_req, res) => {

    res.setHeader(
      "Content-Type",
      register.contentType
    );

    res.end(
      await register.metrics()
    );
  }
);