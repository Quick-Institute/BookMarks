import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const isRender = Boolean(process.env.DATABASE_URL);

const pool = new pg.Pool(
  isRender
    ? {
        connectionString: process.env.DATABASE_URL,
      }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT || 5432),
      }
);

export default pool;
