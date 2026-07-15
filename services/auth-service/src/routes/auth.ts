import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../utils/db";
import { authenticate, AuthRequest } from "../middleware/authenticate";

export const authRouter = Router();


const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});


// JWT config fix for latest jsonwebtoken typings
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

const JWT_EXPIRES_IN =
  (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];


// POST /api/v1/auth/register
authRouter.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {

    try {

      const body = registerSchema.parse(req.body);

      const passwordHash = await bcrypt.hash(body.password, 12);

      const id = uuidv4();


      await pool.execute<ResultSetHeader>(
        `
        INSERT INTO users 
        (id, name, email, password_hash)
        VALUES (?, ?, ?, ?)
        `,
        [
          id,
          body.name,
          body.email,
          passwordHash
        ]
      );


      const [rows] = await pool.execute<RowDataPacket[]>(
        `
        SELECT id, name, email, role, created_at 
        FROM users 
        WHERE id = ?
        `,
        [id]
      );


      const user = rows[0];


      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role
        },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN
        }
      );


      res.status(201).json({
        user,
        token
      });


    } catch (err: any) {


      if (err.code === "ER_DUP_ENTRY") {

        res.status(409).json({
          error: "Email already in use"
        });

        return;
      }


      if (err.name === "ZodError") {

        res.status(400).json({
          error: err.errors
        });

        return;
      }


      next(err);
    }
  }
);





// POST /api/v1/auth/login
authRouter.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {

    try {


      const body = loginSchema.parse(req.body);



      const [rows] = await pool.execute<RowDataPacket[]>(
        `
        SELECT 
          id,
          name,
          email,
          password_hash,
          role
        FROM users
        WHERE email = ?
        AND is_active = TRUE
        `,
        [
          body.email
        ]
      );


      const user = rows[0];


      if (
        !user ||
        !(await bcrypt.compare(
          body.password,
          user.password_hash
        ))
      ) {

        res.status(401).json({
          error: "Invalid credentials"
        });

        return;
      }



      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role
        },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN
        }
      );



      res.json({

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },

        token

      });



    } catch (err: any) {


      if (err.name === "ZodError") {

        res.status(400).json({
          error: err.errors
        });

        return;
      }


      next(err);
    }
  }
);






// GET /api/v1/auth/me
authRouter.get(
  "/me",
  authenticate,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {


    try {


      if (!req.userId) {

        res.status(401).json({
          error: "Unauthorized"
        });

        return;
      }




      const [rows] = await pool.execute<RowDataPacket[]>(
        `
        SELECT 
          id,
          name,
          email,
          role,
          created_at
        FROM users
        WHERE id = ?
        `,
        [
          req.userId
        ]
      );



      if (!rows[0]) {

        res.status(404).json({
          error: "User not found"
        });

        return;
      }



      res.json(rows[0]);



    } catch (err) {

      next(err);

    }

  }
);