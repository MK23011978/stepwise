// Demo data: runs the v1 demo seed into a temp folder and imports it (exercises the real migration path).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { connectPg } from '../src/db/client.js';
import { importLegacy } from '../src/db/legacy-import.js';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stepwise-seed-'));
execFileSync('node', [path.join(ROOT, 'legacy/seed.js'), '--reset'], { env: { ...process.env, DATA_DIR: dir }, cwd: ROOT, stdio: 'inherit' });
const h = connectPg();
await h.migrate();
const report = await importLegacy(h.db, JSON.parse(fs.readFileSync(path.join(dir, 'db.json'), 'utf8')), { reset: true });
await h.close();
console.table(report);
console.log('Demo data loaded ✔ (accounts: see README → Demo accounts)');
