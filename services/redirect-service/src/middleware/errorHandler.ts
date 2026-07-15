import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(err.statusCode || 500).json({ error: "Internal server error" });
};
