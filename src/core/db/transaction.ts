import type { PoolConnection } from "mysql2/promise";
import { getDbPool } from "./pool";

export async function withTransaction<T>(work: (c: PoolConnection) => Promise<T>): Promise<T> {
  const c = await getDbPool().getConnection();
  try {
    await c.beginTransaction();
    const result = await work(c);
    await c.commit();
    return result;
  } catch (error) {
    await c.rollback();
    throw error;
  } finally {
    c.release();
  }
}
