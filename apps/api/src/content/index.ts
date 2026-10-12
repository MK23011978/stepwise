import type { Db } from '../db/client.js';
import type { ContentService } from './types.js';
import { loadDbContent, readVersion } from './db-content.js';
import { importContent, syncContent } from './import.js';

// Content is served from PostgreSQL. On an empty database the seed content is imported once; on later starts new
// seed topics/styles/pages are added (existing rows are never overwritten). Set CONTENT_SYNC=false to skip.
export async function loadContent(db: Db): Promise<ContentService> {
  if (!(await readVersion(db))) await importContent(db);
  else if (process.env.CONTENT_SYNC !== 'false') await syncContent(db);
  return loadDbContent(db);
}
