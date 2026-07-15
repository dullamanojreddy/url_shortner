import { Router, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../utils/db";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const apiKeyRouter = Router();

apiKeyRouter.use(authenticate);


// POST /api/v1/auth/keys — create API key
apiKeyRouter.post(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

      if (!req.userId) {
        res.status(401).json({
          error: "Unauthorized"
        });
        return;
      }

      const name = (req.body.name as string) || "Default";

      const id = uuidv4();

      const rawKey = `sk_${uuidv4().replace(/-/g, "")}`;

      const keyHash = await bcrypt.hash(rawKey, 10);


      await pool.execute<ResultSetHeader>(
        `INSERT INTO api_keys 
        (id, user_id, key_hash, name) 
        VALUES (?, ?, ?, ?)`,
        [
          id,
          req.userId,
          keyHash,
          name
        ]
      );


      res.status(201).json({
        apiKey: rawKey,
        name
      });


    } catch (err) {
      next(err);
    }
  }
);



// GET /api/v1/auth/keys — list keys
apiKeyRouter.get(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

      if (!req.userId) {
        res.status(401).json({
          error:"Unauthorized"
        });
        return;
      }


      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, name, last_used_at, created_at 
         FROM api_keys
         WHERE user_id = ? 
         AND is_active = TRUE
         ORDER BY created_at DESC`,
        [
          req.userId
        ]
      );


      res.json(rows);


    } catch (err) {
      next(err);
    }
  }
);



// DELETE /api/v1/auth/keys/:id
apiKeyRouter.delete(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

      if (!req.userId) {
        res.status(401).json({
          error:"Unauthorized"
        });
        return;
      }


      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE api_keys 
         SET is_active = FALSE 
         WHERE id = ? 
         AND user_id = ?`,
        [
          req.params.id,
          req.userId
        ]
      );


      if (!result.affectedRows) {
        res.status(404).json({
          error:"API key not found"
        });
        return;
      }


      res.status(204).send();


    } catch(err) {
      next(err);
    }
  }
);