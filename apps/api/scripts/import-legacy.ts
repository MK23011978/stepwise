// Usage: DATABASE_URL=postgres://… npm run db:import-legacy -w @stepwise/api -- ../../data/db.json [--reset]
import fs from 'node:fs';
import { connectPg } from '../src/db/client.js';
import { importLegacy } from '../src/db/legacy-import.js';

const file = process.argv.find((a) => a.endsWith('.json')) || '../../data/db.json';
const reset = process.argv.includes('--reset');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const h = connectPg();
await h.migrate();
const report = await importLegacy(h.db, data, { reset });
await h.close();
console.table(report);
console.log(`Imported ${file} ✔`);
