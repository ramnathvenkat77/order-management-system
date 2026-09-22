import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function testDatabaseConnection(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("PostgreSQL connected successfully");
  } finally {
    client.release();
  }
}

export default pool;
