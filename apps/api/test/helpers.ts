import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

// Produce a realistic v1 db.json by running the legacy seed into a temp data dir (cached per test run).
let cached: string | null = null;
export function legacyFixture(): Record<string, any> {
  if (!cached) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stepwise-legacy-'));
    execFileSync('node', [path.join(ROOT, 'legacy/seed.js'), '--reset'], { env: { ...process.env, DATA_DIR: dir }, cwd: ROOT, stdio: 'ignore' });
    cached = path.join(dir, 'db.json');
  }
  return JSON.parse(fs.readFileSync(cached, 'utf8'));
}
