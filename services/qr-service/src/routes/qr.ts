import { Router, Request, Response, NextFunction } from "express";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../utils/db";

export const qrRouter = Router();

interface AuthRequest extends Request {
  userId?: string;
}

function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const h = req.headers.authorization;

  if (!h?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(
      h.slice(7),
      process.env.JWT_SECRET!
    ) as { userId: string };

    req.userId = payload.userId;

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

const BASE_URL = process.env.BASE_URL || "http://localhost";


// GET /api/v1/qr/:shortCode
qrRouter.get(
  "/:shortCode",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

      const { shortCode } = req.params;

      // Fix: ensure userId exists
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }


      const [urlRows] = await pool.execute<RowDataPacket[]>(
        `
        SELECT id 
        FROM urls 
        WHERE short_code = ?
        AND user_id = ?
        AND is_active = TRUE
        `,
        [
          shortCode,
          req.userId
        ]
      );


      if (!urlRows[0]) {
        res.status(404).json({ error: "URL not found" });
        return;
      }


      const urlId = urlRows[0].id;


      const shortUrl = `${BASE_URL}/${shortCode}`;


      const svg = await QRCode.toString(
        shortUrl,
        {
          type: "svg",
          margin: 2,
          width: 256
        }
      );


      await pool.execute<ResultSetHeader>(
        `
        INSERT INTO qr_codes
        (id, url_id, file_path)
        VALUES (?, ?, ?)

        ON DUPLICATE KEY UPDATE
        file_path = VALUES(file_path)
        `,
        [
          uuidv4(),
          urlId,
          `inline:${shortCode}`
        ]
      );


      res.set(
        "Content-Type",
        "image/svg+xml"
      );

      res.send(svg);


    } catch (err) {
      next(err);
    }
  }
);



// GET /api/v1/qr/:shortCode/png

qrRouter.get(
  "/:shortCode/png",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {

    try {

      const { shortCode } = req.params;


      // Fix: ensure userId exists
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }


      const [rows] = await pool.execute<RowDataPacket[]>(
        `
        SELECT id 
        FROM urls
        WHERE short_code = ?
        AND user_id = ?
        AND is_active = TRUE
        `,
        [
          shortCode,
          req.userId
        ]
      );


      if (!rows[0]) {
        res.status(404).json({ error: "URL not found" });
        return;
      }


      const shortUrl = `${BASE_URL}/${shortCode}`;


      const buffer = await QRCode.toBuffer(
        shortUrl,
        {
          type: "png",
          margin: 2,
          width: 512
        }
      );


      res.set(
        "Content-Type",
        "image/png"
      );


      res.set(
        "Content-Disposition",
        `attachment; filename="${shortCode}-qr.png"`
      );


      res.send(buffer);


    } catch (err) {
      next(err);
    }
  }
);