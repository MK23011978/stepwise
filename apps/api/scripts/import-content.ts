// Usage: DATABASE_URL=… npm run db:import-content -w @stepwise/api [-- --overwrite]
import { connectPg } from '../src/db/client.js';
import { importContent } from '../src/content/import.js';
const h = connectPg();
await h.migrate();
console.table(await importContent(h.db, { overwrite: process.argv.includes('--overwrite') }));
await h.close();
console.log('Content imported ✔');
