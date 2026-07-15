import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.statusCode || 500;
  logger.error(err.message, { stack: err.stack });
  res.status(status).json({ error: status === 500 ? "Internal server error" : err.message });
};
