// Tiny JSON-file datastore. Single process, writes are debounced and atomic.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'db.json');

const EMPTY = () => ({
  users: [],
  sessions: {},
  progress: {},      // studentId -> styleId -> { done, correct, incorrect, skipped, lastAt }
  activity: {},      // studentId -> 'YYYY-MM-DD' -> questions answered
  lessons: [],
  examAttempts: [],
  payments: [],
  ledger: [],        // credit movements
  audit: [],
});

let db = EMPTY();
let timer = null;

function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(FILE)) {
    db = Object.assign(EMPTY(), JSON.parse(fs.readFileSync(FILE, 'utf8')));
  }
  return db;
}

function flush() {
  clearTimeout(timer);
  timer = null;
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, FILE);
}

function save() {
  if (!timer) timer = setTimeout(flush, 150);
}

const id = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const h = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return h.length === expected.length && crypto.timingSafeEqual(h, expected);
}

module.exports = { load, save, flush, id, hashPassword, verifyPassword, get data() { return db; }, reset() { db = EMPTY(); } };
