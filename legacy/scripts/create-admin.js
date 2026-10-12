// Create (or promote) an admin account.
// Usage: npm run create-admin -- --email you@example.com --name "Your Name" --password "min 8 chars"
const store = require('../db');
const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((a) => { const [k, ...v] = a.trim().split(' '); return [k, v.join(' ').replace(/^"|"$/g, '')]; }));
const email = String(args.email || '').toLowerCase().trim();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !args.password || args.password.length < 8) {
  console.error('Usage: npm run create-admin -- --email you@example.com --name "Your Name" --password "min 8 chars"');
  process.exit(1);
}
store.load();
const { salt, hash } = store.hashPassword(args.password);
let u = store.data.users.find((x) => x.email === email);
if (u) {
  Object.assign(u, { role: 'admin', status: 'active', salt, passHash: hash, name: args.name || u.name });
  console.log(`Promoted ${email} to admin and set the new password.`);
} else {
  u = { id: store.id('usr'), role: 'admin', name: args.name || 'Admin', email, salt, passHash: hash, status: 'active', credits: 0, createdAt: new Date().toISOString(), avatarColor: '#ef4444' };
  store.data.users.push(u);
  console.log(`Created admin ${email}.`);
}
store.data.audit.unshift({ at: new Date().toISOString(), actor: null, actorName: 'system', action: 'create-admin', detail: email });
store.flush();
