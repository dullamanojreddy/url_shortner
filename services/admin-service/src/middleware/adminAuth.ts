import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AdminRequest extends Request {
  adminId?: string;
}

export const adminAuth = (req: AdminRequest, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET!;
    const payload = jwt.verify(h.slice(7), secret) as { userId: string; role: string };
    if (payload.role !== "admin") { res.status(403).json({ error: "Forbidden: admin only" }); return; }
    req.adminId = payload.userId;
    next();
  } catch { res.status(401).json({ error: "Invalid token" }); }
};
