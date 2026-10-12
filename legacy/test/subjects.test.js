// Validates every non-maths subject module. Run: node test/subjects.test.js
const { execFileSync } = require('child_process');
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', '..', 'packages', 'content-seed', 'subjects');
const validator = path.join(__dirname, '..', '..', 'packages', 'content-seed', 'validate.cjs');
const ids = fs.readdirSync(dir).filter((f) => f.endsWith('.cjs')).map((f) => f.slice(0, -4));
let failed = 0;
for (const id of ids) {
  try { console.log(execFileSync('node', [validator, id], { encoding: 'utf8' }).trim().split('\n').pop().replace(/^/, `${id}: `)); }
  catch (e) { failed++; console.log(`${id}: FAILED\n${e.stdout}`); }
}
if (failed) process.exit(1);
console.log(`All ${ids.length} subjects valid ✔`);
