import type Stripe from 'stripe';
import type { Db } from '../db/client.js';
import type { ContentService } from '../content/types.js';
import type { Config } from './config.js';
import type { ExamDef } from '../modules/common/domain.js';

// Everything a service needs, injected once at start-up (no module-level state → stateless instances).
export interface Deps { db: Db; content: ContentService; config: Config; stripe: Stripe | null; exams: ExamDef[] }
