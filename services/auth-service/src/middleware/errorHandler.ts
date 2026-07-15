import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.statusCode || 500;
  logger.error(err.message, { stack: err.stack });
  res.status(status).json({
    error: status === 500 ? "Internal server error" : err.message,
  });
};
