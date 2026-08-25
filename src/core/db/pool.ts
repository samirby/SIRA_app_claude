import mysql, { type Pool } from "mysql2/promise";
import { getEnvironment } from "@/core/config/env";

declare global { var __siraPool: Pool | undefined; }

export function getDbPool(): Pool {
  if (global.__siraPool) return global.__siraPool;
  const env = getEnvironment();
  const pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    decimalNumbers: true,
    timezone: "Z"
  });
  global.__siraPool = pool;
  return global.__siraPool;
}
