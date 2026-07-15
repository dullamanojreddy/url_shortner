import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId: string;
  userRole: string;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {

  const authReq = req as AuthRequest;

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized"
    });
    return;
  }

  try {

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as {
      userId: string;
      role: string;
    };


    authReq.userId = decoded.userId;
    authReq.userRole = decoded.role;

    next();

  } catch (error) {

    res.status(401).json({
      error: "Invalid or expired token"
    });

  }
}