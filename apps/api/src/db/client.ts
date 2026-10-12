// Database connection factory. Production / dev: node-postgres (Cloud SQL or docker compose).
// Tests: PGlite — PostgreSQL 16 compiled to WASM, running in-process (no server needed).
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from './schema.js';

export type Db = NodePgDatabase<typeof schema>;
export const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../drizzle');

export interface DbHandle { db: Db; close: () => Promise<void>; migrate: () => Promise<void>; kind: 'pg' | 'pglite' }

export function connectPg(url = process.env.DATABASE_URL): DbHandle {
  if (!url) throw new Error('DATABASE_URL is not set');
  const pool = new pg.Pool({ connectionString: url, max: Number(process.env.DB_POOL_MAX || 10) });
  const db = drizzlePg(pool, { schema });
  return { db, kind: 'pg', close: () => pool.end(), migrate: () => migratePg(db, { migrationsFolder: MIGRATIONS_DIR }) };
}

// Loaded lazily so production images don't need PGlite (it's a dev/test dependency).
export async function connectPglite(dataDir?: string): Promise<DbHandle> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite');
  const { migrate: migratePglite } = await import('drizzle-orm/pglite/migrator');
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema }) as unknown as Db;
  return { db, kind: 'pglite', close: () => client.close(), migrate: () => migratePglite(db as never, { migrationsFolder: MIGRATIONS_DIR }) };
}

export { schema };
