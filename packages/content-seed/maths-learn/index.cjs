// Maths teaching pages, merged from the per-year files that exist.
const fs = require('fs');
const path = require('path');
const out = {};
for (const f of ['learn-y7.cjs', 'learn-y8-9.cjs', 'learn-y10-11.cjs']) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) continue;
  try { Object.assign(out, require(p)); } catch (e) { console.warn(`[content] could not load ${f}: ${e.message}`); }
}
module.exports = out;
