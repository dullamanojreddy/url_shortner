import mysql from "mysql2/promise";
import { logger } from "./logger";

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "mysql",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  user: process.env.MYSQL_USER || "urlshortener",
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || "urlshortener",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection()
  .then(conn => { logger.info("MySQL pool connected"); conn.release(); })
  .catch(err => logger.error("MySQL pool connection error", err));
