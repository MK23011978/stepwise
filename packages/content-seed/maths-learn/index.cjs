// Maths teaching pages, merged from the per-year files that exist.
const fs = require('fs');
const path = require('path');
const out = {};
for (const f of ['learn-y7.cjs', 'learn-y8-9.cjs', 'learn-y10-11.cjs']) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) continue;
  try { Object.assign(out, require(p)); } catch (e) { console.warn(`[content] could not load ${f}: ${e.message}`); }
}
// Year 9 school-unit pages: one file per unit group in ./y9s/
const y9s = path.join(__dirname, 'y9s');
if (fs.existsSync(y9s)) for (const f of fs.readdirSync(y9s).filter((x) => x.endsWith('.cjs')).sort()) {
  try { Object.assign(out, require(path.join(y9s, f))); } catch (e) { console.warn(`[content] could not load y9s/${f}: ${e.message}`); }
}
module.exports = out;
