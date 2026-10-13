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
// A file may also export __extraSections: { [existingTopicId]: [{ title, html }] } to add sections (e.g. school-style
// worked examples) to a page defined elsewhere.
const extra = [];
if (fs.existsSync(y9s)) for (const f of fs.readdirSync(y9s).filter((x) => x.endsWith('.cjs')).sort()) {
  try { const { __extraSections, ...pages } = require(path.join(y9s, f)); Object.assign(out, pages); if (__extraSections) extra.push(__extraSections); } catch (e) { console.warn(`[content] could not load y9s/${f}: ${e.message}`); }
}
for (const x of extra) for (const [id, secs] of Object.entries(x)) if (out[id]) out[id] = { ...out[id], sections: [...out[id].sections, ...secs] };
module.exports = out;
