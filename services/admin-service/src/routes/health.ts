import { Router, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2/promise";
import { pool } from "../utils/db";
import { redis } from "../utils/redis";
import { adminAuth, AdminRequest } from "../middleware/adminAuth";

export const healthRouter = Router();
healthRouter.use(adminAuth);

// GET /api/v1/admin/health
healthRouter.get("/", async (_req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    // DB check
    const dbStart = Date.now();
    await pool.execute("SELECT 1");
    const dbLatencyMs = Date.now() - dbStart;

    // Redis check
    const redisStart = Date.now();
    await redis.ping();
    const redisLatencyMs = Date.now() - redisStart;

    // Stats
    const [[urlRows], [userRows], [clickRows], redisDbSize] = await Promise.all([
      pool.execute<RowDataPacket[]>("SELECT COUNT(*) AS count FROM urls WHERE is_active = TRUE"),
      pool.execute<RowDataPacket[]>("SELECT COUNT(*) AS count FROM users WHERE is_active = TRUE"),
      pool.execute<RowDataPacket[]>("SELECT COUNT(*) AS count FROM clicks"),
      redis.dbsize(),
    ]);

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: { status: "up", latencyMs: dbLatencyMs },
      redis: { status: "up", latencyMs: redisLatencyMs, keyCount: redisDbSize },
      stats: {
        activeUrls: parseInt((urlRows as RowDataPacket[])[0].count, 10),
        activeUsers: parseInt((userRows as RowDataPacket[])[0].count, 10),
        totalClicks: parseInt((clickRows as RowDataPacket[])[0].count, 10),
      },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/health/top-urls — top 10 most clicked URLs
healthRouter.get("/top-urls", async (_req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT short_code, original_url, click_count, created_at
       FROM urls WHERE is_active = TRUE ORDER BY click_count DESC LIMIT 10`
    );
    res.json(rows);
  } catch (err) { next(err); }
});
