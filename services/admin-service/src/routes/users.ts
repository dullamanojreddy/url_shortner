import { Router, Response, NextFunction } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../utils/db";
import { adminAuth, AdminRequest } from "../middleware/adminAuth";

export const usersRouter = Router();
usersRouter.use(adminAuth);

// GET /api/v1/admin/users
usersRouter.get("/", async (_req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
              (SELECT COUNT(*) FROM urls WHERE user_id = u.id) AS url_count
       FROM users u ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PUT /api/v1/admin/users/:id/activate
usersRouter.put("/:id/activate", async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    await pool.execute<ResultSetHeader>(
      `UPDATE users SET is_active = TRUE WHERE id = ?`, [req.params.id]
    );
    res.json({ message: "User activated" });
  } catch (err) { next(err); }
});

// PUT /api/v1/admin/users/:id/deactivate
usersRouter.put("/:id/deactivate", async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    await pool.execute<ResultSetHeader>(
      `UPDATE users SET is_active = FALSE WHERE id = ?`, [req.params.id]
    );
    res.json({ message: "User deactivated" });
  } catch (err) { next(err); }
});

// PUT /api/v1/admin/users/:id/role
usersRouter.put("/:id/role", async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }
    await pool.execute<ResultSetHeader>(
      `UPDATE users SET role = ? WHERE id = ?`, [role, req.params.id]
    );
    res.json({ message: "Role updated" });
  } catch (err) { next(err); }
});

// DELETE /api/v1/admin/users/:id
usersRouter.delete("/:id", async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    await pool.execute<ResultSetHeader>(
      `DELETE FROM users WHERE id = ?`, [req.params.id]
    );
    res.status(204).send();
  } catch (err) { next(err); }
});
