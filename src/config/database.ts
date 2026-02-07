import { config, ConnectionPool } from 'mssql';
import { AppEnvironments } from '../enums/AppEnvironments';
import { env } from './env';

const dbConfig: config = {
  server: env.DB_SERVER,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
  options: {
    encrypt: env.APP_ENV === AppEnvironments.PRODUCTION,
    trustServerCertificate: env.APP_ENV !== AppEnvironments.PRODUCTION,
  },
  pool: {
    max: 2,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: ConnectionPool | null = null;

export async function getPool(): Promise<ConnectionPool> {
  if (!pool) {
    pool = new ConnectionPool(dbConfig);
    await pool.connect();
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
