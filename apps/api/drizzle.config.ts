import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL || 'postgres://stepwise:stepwise@localhost:5432/stepwise' },
  strict: true,
});
