import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const query = (text, params) => pool.query(text, params);
export async function assertDbConnection() {
  const result = await query('SELECT NOW() as now');
  return result.rows[0];
}
