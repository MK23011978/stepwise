// Apply pending migrations to DATABASE_URL (used locally and as a Cloud Run job before each deploy).
import { connectPg } from '../src/db/client.js';
const h = connectPg();
await h.migrate();
await h.close();
console.log('Migrations applied ✔');
