import type { Db } from '../../db/client.js';
import * as s from '../../db/schema.js';
import { newId } from '../../core/ids.js';
export async function audit(db: Db, actor: { id: string; name: string } | null, action: string, detail = '') {
  await db.insert(s.auditLog).values({ id: newId('aud'), actorId: actor?.id || null, actorName: actor?.name || 'system', action, detail });
}
