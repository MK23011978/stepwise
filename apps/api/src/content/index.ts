import type { Db } from '../db/client.js';
import type { ContentService } from './types.js';
import { loadDbContent, readVersion } from './db-content.js';
import { importContent } from './import.js';

// Content is served from PostgreSQL. On an empty database the seed content is imported once.
export async function loadContent(db: Db): Promise<ContentService> {
  if (!(await readVersion(db))) await importContent(db);
  return loadDbContent(db);
}
