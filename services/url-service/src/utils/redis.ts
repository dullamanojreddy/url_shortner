import Redis from "ioredis";
import { logger } from "./logger";
export const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");
redis.on("error", err => logger.error("Redis error", err));
