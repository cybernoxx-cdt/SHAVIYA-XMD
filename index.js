// ================= Required Modules =================
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers,
  proto,
  generateWAMessageFromContent,
} = require("@whiskeysockets/baileys");

// ── Suppress libsignal / Baileys noise logs ──
const _origWrite = process.stdout.write.bind(process.stdout);
const _origErrWrite = process.stderr.write.bind(process.stderr);
const SUPPRESS_PATTERNS = [
  "Bad MAC","Failed to decrypt","Session error","Closing open session",
  "Closing session","Decrypted message with closed session","closed session",
  "SessionEntry","no session","No session","Invalid PreKey",
  "decryptWithSessions","ephemeralKeyPair","lastRemoteEphemeralKey",
  "pendingPreKey","remoteIdentityKey","currentRatchet","indexInfo",
  "baseKeyType","_chains","registrationId","useNewUrlParser",
  "useUnifiedTopology","session_cipher","queue_job",
  "verifyMAC","at async _asyncQueue","at async SessionCipher","at Object.verifyMAC",
];
function shouldSuppress(str) {
  if (typeof str !== "string") return false;
  return SUPPRESS_PATTERNS.some(p => str.includes(p));
}
process.stdout.write = function(chunk, encoding, cb) {
  try {
    if (shouldSuppress(String(chunk))) {
      if (typeof encoding === "function") encoding();
      else if (typeof cb === "function") cb();
      return true;
    }
    return _origWrite(chunk, encoding, cb);
  } catch (e) { return true; }
};
process.stderr.write = function(chunk, encoding, cb) {
  try {
    if (shouldSuppress(String(chunk))) {
      if (typeof encoding === "function") encoding();
      else if (typeof cb === "function") cb();
      return true;
    }
    return _origErrWrite(chunk, encoding, cb);
  } catch (e) { return true; }
};

const fs      = require("fs");
const P       = require("pino");
const path    = require("path");
const express = require("express");
const config  = require("./config");
const connectDB = require("./lib/mongodb");
const { loadSettingsFromDB } = require("./lib/settings");

// lib modules — lazy load
let sms;
let antidelete, handleAutoForward;
const { initAntiCrash } = require('./lib/anticrash');

// ╔══════════════════════════════════════════════════════════════╗
// ║  SESSION SYSTEM  (all inside index.js)                       ║
// ║   1. SESSION CODEC      compact id  SHAVIYA~…                ║
// ║   2. MONGO AUTH STATE   keys kept in MongoDB                 ║
// ║   3. SESSION MANAGER    multi-session (env / hot-add)        ║
// ║   4. OWNER COMMANDS     .sessions .addsession .delsession    ║
// ║   5. CLI                node index.js pack <creds.json>      ║
// ║                                                              ║
// ║  Env:  SESSION_ID · SESSION_ID_2…20 · SESSION_IDS            ║
// ║        SESSION_ID_PART_1..N · SESSION_STORE · MAX_SESSIONS   ║
// ╚══════════════════════════════════════════════════════════════╝
const mongoose = require("mongoose");

// ───────────────────── 1. SESSION CODEC ─────────────────────
const sessionCodec = (() => {
const zlib = require('zlib');

const PREFIX      = 'SHAVIYA~';
const CHUNK_LIMIT = 40000;           // safe size for one GitHub secret (max 48 KB)
const LEGACY_PREFIXES = ['SHAVIYA-XMD_', 'ranu&', 'HASIYA_', 'shavi&'];

const isCreds = (o) => !!(o && typeof o === 'object' && o.noiseKey && o.signedIdentityKey);

/**
 * payload = creds object            → single creds.json
 *         | { creds, files }        → creds + extra key files { "pre-key-1.json": {...} }
 */
function encode(payload) {
  let body;
  if (isCreds(payload)) {
    body = { c: payload };
  } else if (payload && isCreds(payload.creds)) {
    body = { c: payload.creds };
    if (payload.files && Object.keys(payload.files).length) body.f = payload.files;
  } else {
    throw new Error('Not a valid creds object (noiseKey / signedIdentityKey missing)');
  }
  const json = Buffer.from(JSON.stringify(body));
  const packed = zlib.brotliCompressSync(json, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: json.length,
    },
  });
  return PREFIX + packed.toString('base64url');
}

function inflate(buf) {
  try { return zlib.brotliDecompressSync(buf); } catch (_) {}
  try { return zlib.gunzipSync(buf); }           catch (_) {}
  return zlib.inflateSync(buf);
}

/** Returns { creds, files } or throws. */
function decode(input) {
  let raw = String(input || '').trim().replace(/^["']+|["']+$/g, '');
  if (!raw) throw new Error('Empty session id');

  // ── new compact format ──
  if (raw.startsWith(PREFIX)) {
    const buf  = Buffer.from(raw.slice(PREFIX.length), 'base64url');
    const body = JSON.parse(inflate(buf).toString('utf8'));
    if (!isCreds(body.c)) throw new Error('Compact session is damaged (creds missing)');
    return { creds: body.c, files: body.f || {} };
  }

  // ── raw JSON ──
  if (raw.startsWith('{')) {
    const parsed = JSON.parse(raw);
    if (!isCreds(parsed)) throw new Error('JSON is not a valid creds.json');
    return { creds: parsed, files: {} };
  }

  // ── legacy base64 (strip known prefixes) ──
  for (const p of LEGACY_PREFIXES) {
    if (raw.startsWith(p)) { raw = raw.slice(p.length); break; }
  }
  const text   = Buffer.from(raw, 'base64').toString('utf8');
  const parsed = JSON.parse(text);
  if (!isCreds(parsed)) throw new Error('Base64 does not contain valid creds');
  return { creds: parsed, files: {} };
}

/** Read an auth folder (creds.json + key files) → { creds, files } */
function packFolder(dir) {
  const credsFile = path.join(dir, 'creds.json');
  if (!fs.existsSync(credsFile)) throw new Error(`creds.json not found in ${dir}`);
  const creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
  if (!isCreds(creds)) throw new Error('creds.json is not valid');
  const files = {};
  for (const f of fs.readdirSync(dir)) {
    if (f === 'creds.json' || !f.endsWith('.json')) continue;
    try { files[f] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (_) {}
  }
  return { creds, files };
}

/** Split a long string into GitHub-secret-sized parts. */
function split(str, size = CHUNK_LIMIT) {
  const out = [];
  for (let i = 0; i < str.length; i += size) out.push(str.slice(i, i + size));
  return out;
}
return { PREFIX, CHUNK_LIMIT, isCreds, encode, decode, packFolder, split };
})();

// ───────────────────── 2. MONGO AUTH STATE ─────────────────────
const mongoAuth = (() => {

const fixKey = (k) => String(k).replace(/\//g, '__').replace(/:/g, '-');   // same rule as multi-file auth

function getModel() {
  if (mongoose.models.ShaviyaAuth) return mongoose.models.ShaviyaAuth;
  const schema = new mongoose.Schema(
    { _id: String, sid: { type: String, index: true }, v: String },
    { versionKey: false }
  );
  return mongoose.model('ShaviyaAuth', schema, 'shaviya_auth');
}

const baileys = () => require('@whiskeysockets/baileys');

async function readCreds(sid) {
  const { BufferJSON } = baileys();
  const d = await getModel().findById(`${sid}:creds`).lean();
  return d ? JSON.parse(d.v, BufferJSON.reviver) : null;
}

/** Remove every stored doc of one session. */
async function clearSession(sid) {
  await getModel().deleteMany({ sid });
}

/** Write creds (+ optional key files imported from an old auth folder). */
async function seed(sid, creds, files = {}) {
  const { BufferJSON } = baileys();
  const M   = getModel();
  // creds.json holds {type:'Buffer',data:'<base64>'} → turn into real Buffers first,
  // otherwise BufferJSON.replacer would base64-encode the base64 text a second time.
  const live = JSON.parse(JSON.stringify(creds), BufferJSON.reviver);
  const ops = [{
    updateOne: {
      filter: { _id: `${sid}:creds` },
      update: { $set: { sid, v: JSON.stringify(live, BufferJSON.replacer) } },
      upsert: true,
    },
  }];
  for (const [file, content] of Object.entries(files)) {
    if (!file.endsWith('.json')) continue;
    const key = fixKey(file.slice(0, -5));
    ops.push({
      updateOne: {
        filter: { _id: `${sid}:${key}` },
        update: { $set: { sid, v: JSON.stringify(content) } },
        upsert: true,
      },
    });
  }
  await M.bulkWrite(ops, { ordered: false });
}

async function useMongoAuthState(sid) {
  const { initAuthCreds, BufferJSON, proto } = baileys();
  const M     = getModel();
  const cache = new Map();

  const read = async (key) => {
    const k = fixKey(key);
    if (cache.has(k)) return cache.get(k);
    const d = await M.findById(`${sid}:${k}`).lean();
    const v = d ? JSON.parse(d.v, BufferJSON.reviver) : null;
    if (v) cache.set(k, v);
    return v;
  };

  const creds = (await readCreds(sid)) || initAuthCreds();

  // serialise writes so creds are never saved out of order
  let chain = Promise.resolve();
  const saveCreds = () => {
    chain = chain
      .then(() => M.updateOne(
        { _id: `${sid}:creds` },
        { $set: { sid, v: JSON.stringify(creds, BufferJSON.replacer) } },
        { upsert: true }
      ))
      .catch((e) => console.log(`[AUTH][${sid}] creds save error:`, e.message));
    return chain;
  };

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(ids.map(async (id) => {
            try {
              let v = await read(`${type}-${id}`);
              if (type === 'app-state-sync-key' && v) v = proto.Message.AppStateSyncKeyData.fromObject(v);
              data[id] = v;
            } catch (e) { data[id] = null; }
          }));
          return data;
        },
        set: async (data) => {
          const ops = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key   = fixKey(`${category}-${id}`);
              if (value) {
                cache.set(key, value);
                ops.push({
                  updateOne: {
                    filter: { _id: `${sid}:${key}` },
                    update: { $set: { sid, v: JSON.stringify(value, BufferJSON.replacer) } },
                    upsert: true,
                  },
                });
              } else {
                cache.delete(key);
                ops.push({ deleteOne: { filter: { _id: `${sid}:${key}` } } });
              }
            }
          }
          if (cache.size > 8000) cache.clear();
          if (ops.length) {
            try { await M.bulkWrite(ops, { ordered: false }); }
            catch (e) { console.log(`[AUTH][${sid}] keys save error:`, e.message); }
          }
        },
      },
    },
    saveCreds,
  };
}
return { useMongoAuthState, readCreds, clearSession, seed, getModel };
})();

// ───────────────────── 3. SESSION MANAGER ─────────────────────
const sessionManager = (() => {
const os     = require('os');
const crypto = require('crypto');
const codec  = sessionCodec;

const BASE_DIR     = path.join(__dirname, 'auth_info_baileys');
const MAX_SESSIONS = Math.max(1, parseInt(process.env.MAX_SESSIONS || '10', 10));

/** sessionId → { sessionId, authPath, store: 'mongo'|'file', number, source } */
const sessions = new Map();

const ensureDir = (d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); };
const mongoReady = () => mongoose.connection.readyState === 1;

function storeMode() {
  const want = String(process.env.SESSION_STORE || 'auto').toLowerCase();
  if (want === 'file') return 'file';
  if (mongoReady()) return 'mongo';
  if (want === 'mongo') console.log('[SESSION] SESSION_STORE=mongo but MongoDB is not connected → using local files.');
  return 'file';
}

// ── tiny helpers ────────────────────────────────────────────
const numberOf = (creds) => String(creds?.me?.id || '').split(':')[0].split('@')[0].replace(/\D/g, '');

// bytes of a key, whatever shape it has (Buffer, {type:'Buffer',data:base64|array}, Uint8Array)
function toHex(x) {
  if (!x) return '';
  if (Buffer.isBuffer(x)) return x.toString('hex');
  if (x instanceof Uint8Array) return Buffer.from(x).toString('hex');
  if (x.type === 'Buffer') {
    return (Array.isArray(x.data) ? Buffer.from(x.data) : Buffer.from(String(x.data), 'base64')).toString('hex');
  }
  return String(x);
}

// identity of an account's creds — same account ⇒ same fingerprint, even after key rotation
function fingerprint(creds) {
  return crypto.createHash('sha256')
    .update([creds.registrationId, toHex(creds.noiseKey?.public), toHex(creds.signedIdentityKey?.public)].join('|'))
    .digest('hex');
}

const mask = (s) => (s.length > 10 ? `${s.slice(0, 4)}…${s.slice(-3)}` : '***');

function registryModel() {
  if (mongoose.models.ShaviyaSession) return mongoose.models.ShaviyaSession;
  const schema = new mongoose.Schema(
    { _id: String, number: String, source: String, enabled: { type: Boolean, default: true }, addedAt: { type: Date, default: Date.now } },
    { versionKey: false }
  );
  return mongoose.model('ShaviyaSession', schema, 'shaviya_sessions');
}

// ── MEGA download (kept for old "ranu&" / "shavi&" session ids) ──
async function fromMega(url) {
  const { File } = require('megajs');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shaviya-mega-'));
  try {
    const file = File.fromURL(url);
    await file.loadAttributes();
    const grab = async (node, target) => {
      await new Promise((resolve, reject) => {
        const stream = node.download();
        const w = fs.createWriteStream(target);
        stream.on('error', reject); w.on('error', reject); w.on('finish', resolve);
        stream.pipe(w);
      });
    };
    if (file.directory) {
      for (const child of file.children || []) {
        if (!child.directory && /\.json$/i.test(child.name)) await grab(child, path.join(tmp, child.name));
      }
    } else {
      await grab(file, path.join(tmp, 'creds.json'));
    }
    return codec.packFolder(tmp);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** any supported session string → { creds, files } */
async function resolveRaw(input) {
  const raw = String(input || '').trim().replace(/^["']+|["']+$/g, '');
  if (!raw) throw new Error('empty session id');
  if (raw.startsWith(codec.PREFIX)) return codec.decode(raw);
  if (/^https?:\/\/mega\.nz/i.test(raw) || raw.startsWith('mega://')) return fromMega(raw);
  if (/^(ranu|shavi)&/.test(raw) && raw.length < 100) {
    return fromMega('https://mega.nz/file/' + raw.slice(raw.indexOf('&') + 1));
  }
  return codec.decode(raw);
}

// ── collect session strings from env ────────────────────────
function collectEnvSessions(env = process.env) {
  const out = [];
  const seen = new Set();
  const push = (slot, raw) => {
    raw = String(raw || '').trim();
    if (!raw || seen.has(raw)) return;
    seen.add(raw);
    out.push({ slot, raw });
  };

  // primary – single or split into parts
  const parts = Object.keys(env)
    .map((k) => /^SESSION_ID_PART_(\d+)$/.exec(k))
    .filter(Boolean)
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map((m) => String(env[m[0]] || '').trim())
    .join('');
  push('main', env.SESSION_ID || parts);

  // numbered extras
  Object.keys(env)
    .map((k) => /^SESSION_ID_(\d+)$/.exec(k))
    .filter(Boolean)
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .forEach((m) => push(`slot${m[1]}`, env[m[0]]));

  // bulk variable
  const bulk = String(env.SESSION_IDS || '').trim();
  if (bulk) {
    let list = [];
    if (bulk.startsWith('[') || bulk.startsWith('{')) {
      try {
        const j = JSON.parse(bulk);
        list = Array.isArray(j) ? j : Object.values(j);
      } catch (e) { console.log('[SESSION] SESSION_IDS is not valid JSON:', e.message); }
    } else {
      list = bulk.split(/[\s,;|]+/);
    }
    list.forEach((raw, i) => push(`bulk${i + 1}`, raw));
  }
  return out;
}

// ── seed one decoded session into the chosen store ──────────
async function seed(name, { creds, files }, mode, source) {
  const authPath = path.join(BASE_DIR, name);
  const fp = fingerprint(creds);

  if (mode === 'mongo') {
    const stored = await mongoAuth.readCreds(name);
    if (stored && fingerprint(stored) === fp) {
      console.log(`[SESSION][${name}] Same account found in MongoDB → using stored (newer) state.`);
    } else {
      if (stored) console.log(`[SESSION][${name}] SESSION_ID changed → replacing stored state.`);
      await mongoAuth.clearSession(name);
      await mongoAuth.seed(name, creds, files);
      console.log(`[SESSION][${name}] Seeded into MongoDB.`);
    }
  } else {
    ensureDir(authPath);
    const credsFile = path.join(authPath, 'creds.json');
    let keep = false;
    if (fs.existsSync(credsFile)) {
      try { keep = fingerprint(JSON.parse(fs.readFileSync(credsFile, 'utf8'))) === fp; } catch (_) {}
    }
    if (keep) {
      console.log(`[SESSION][${name}] Valid creds.json found — skipping decode.`);
    } else {
      fs.rmSync(authPath, { recursive: true, force: true });
      ensureDir(authPath);
      fs.writeFileSync(credsFile, JSON.stringify(creds, null, 2));
      for (const [f, content] of Object.entries(files || {})) {
        if (/^[\w.\-]+\.json$/.test(f)) fs.writeFileSync(path.join(authPath, f), JSON.stringify(content));
      }
      console.log(`[SESSION][${name}] Written to auth_info_baileys/${name}/creds.json`);
    }
  }
  return { sessionId: name, authPath, store: mode, number: numberOf(creds) };
}

function pickName(slot, creds, taken) {
  if (slot === 'main' && !taken.has('main')) return 'main';
  const n = numberOf(creds);
  let name = n || slot;
  let i = 2;
  while (taken.has(name)) name = `${n || slot}_${i++}`;
  return name;
}

// ── public API ──────────────────────────────────────────────
/** Boot: env sessions + registry sessions + leftover local folders. */
async function init() {
  const mode  = storeMode();
  const found = collectEnvSessions();
  console.log(`[SESSION] Store: ${mode.toUpperCase()} | env sessions: ${found.length}`);

  const byNumber = new Set();
  for (const { slot, raw } of found) {
    if (sessions.size >= MAX_SESSIONS) { console.log(`[SESSION] MAX_SESSIONS (${MAX_SESSIONS}) reached — skipping the rest.`); break; }
    try {
      const data   = await resolveRaw(raw);
      const number = numberOf(data.creds);
      if (number && byNumber.has(number)) { console.log(`[SESSION] ${mask(raw)} is the same account (${number}) as another session — skipped.`); continue; }
      if (number) byNumber.add(number);
      const name = pickName(slot, data.creds, new Set(sessions.keys()));
      const info = await seed(name, data, mode, 'env');
      sessions.set(name, { ...info, source: 'env' });
    } catch (e) {
      console.log(`[SESSION] ${slot} (${mask(raw)}) failed: ${e.message}`);
    }
  }

  // sessions added with .addsession (kept in MongoDB)
  if (mode === 'mongo') {
    try {
      const rows = await registryModel().find({ enabled: true }).lean();
      for (const r of rows) {
        if (sessions.has(r._id) || (r.number && byNumber.has(r.number))) continue;
        if (sessions.size >= MAX_SESSIONS) break;
        const stored = await mongoAuth.readCreds(r._id);
        if (!stored) continue;
        sessions.set(r._id, { sessionId: r._id, authPath: path.join(BASE_DIR, r._id), store: 'mongo', number: r.number || numberOf(stored), source: 'cmd' });
        console.log(`[SESSION][${r._id}] Restored from MongoDB registry.`);
      }
    } catch (e) { console.log('[SESSION] Registry load error:', e.message); }
  }

  // old-style local sessions (paired by hand / legacy layout)
  if (mode === 'file' && fs.existsSync(BASE_DIR)) {
    if (!sessions.has('main') && fs.existsSync(path.join(BASE_DIR, 'creds.json'))) {
      sessions.set('main', { sessionId: 'main', authPath: BASE_DIR, store: 'file', number: '', source: 'local' });
      console.log('[SESSION][main] Legacy creds.json found in auth_info_baileys/.');
    }
    for (const e of fs.readdirSync(BASE_DIR, { withFileTypes: true })) {
      if (!e.isDirectory() || sessions.has(e.name)) continue;
      const p = path.join(BASE_DIR, e.name);
      if (!fs.existsSync(path.join(p, 'creds.json')) || sessions.size >= MAX_SESSIONS) continue;
      sessions.set(e.name, { sessionId: e.name, authPath: p, store: 'file', number: '', source: 'local' });
      console.log(`[SESSION][${e.name}] Local session folder found.`);
    }
  }

  if (!sessions.size) {
    console.log('[SESSION] No session available. Set SESSION_ID (or SESSION_IDS) and restart.');
  }
  return list();
}

/** Hot-add from a session string. Returns the new session info. */
async function add(raw, { source = 'cmd' } = {}) {
  if (sessions.size >= MAX_SESSIONS) throw new Error(`MAX_SESSIONS (${MAX_SESSIONS}) reached`);
  const mode = storeMode();
  if (mode !== 'mongo') throw new Error('Hot-add needs MongoDB (set MONGODB_URI) so the session survives restarts');
  const data   = await resolveRaw(raw);
  const number = numberOf(data.creds);
  if (!number) throw new Error('This creds.json has no paired number (me.id missing)');
  for (const s of sessions.values()) if (s.number === number) throw new Error(`Number ${number} is already running as "${s.sessionId}"`);
  const name = pickName('', data.creds, new Set(sessions.keys()));
  const info = await seed(name, data, 'mongo', source);
  await registryModel().updateOne({ _id: name }, { $set: { number, source, enabled: true, addedAt: new Date() } }, { upsert: true });
  const rec = { ...info, source };
  sessions.set(name, rec);
  return rec;
}

/** Forget a session and delete its stored state. */
async function remove(name) {
  const s = sessions.get(name);
  if (!s) throw new Error(`No such session: ${name}`);
  sessions.delete(name);
  if (s.store === 'mongo') {
    await mongoAuth.clearSession(name).catch(() => {});
    await registryModel().deleteOne({ _id: name }).catch(() => {});
  } else if (s.authPath && s.authPath !== BASE_DIR) {
    fs.rmSync(s.authPath, { recursive: true, force: true });
  }
  return s;
}

/** Baileys auth state for a running session. */
async function getAuthState(sessionId, fallbackPath) {
  const s = sessions.get(sessionId);
  if (s && s.store === 'mongo' && mongoReady()) return mongoAuth.useMongoAuthState(sessionId);
  const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
  const dir = s?.authPath || fallbackPath;
  ensureDir(dir);
  return useMultiFileAuthState(dir);
}

const list = () => [...sessions.values()];
const get  = (name) => sessions.get(name);
return { init, add, remove, list, get, getAuthState, resolveRaw, collectEnvSessions, numberOf, MAX_SESSIONS };
})();

// ───────────────────── 5. CLI (before the bot starts) ─────────────────────
//   node index.js pack   <creds.json | auth-folder> [--full]
//   node index.js unpack <SESSION_ID> [outDir]
if (["pack", "unpack"].includes(process.argv[2])) {
  try {
    if (process.argv[2] === "pack") {
      const rest  = process.argv.slice(3);
      const full  = rest.includes("--full");
      const input = rest.find(a => !a.startsWith("--")) || path.join(__dirname, "auth_info_baileys");
      let payload;
      if (fs.statSync(input).isDirectory()) { const d = sessionCodec.packFolder(input); payload = full ? d : d.creds; }
      else payload = JSON.parse(fs.readFileSync(input, "utf8"));
      const id = sessionCodec.encode(payload);
      const parts = sessionCodec.split(id);
      console.log(`\n✅ Compact session created (${id.length} characters${full ? ", full folder" : ""})\n`);
      if (parts.length === 1) {
        console.log("GitHub → Settings → Secrets and variables → Actions → New secret\nName : SESSION_ID\nValue:\n\n" + id + "\n");
      } else {
        console.log(`⚠️ Bigger than one GitHub secret (48 KB) → ${parts.length} secrets:\n`);
        parts.forEach((p, i) => console.log(`Name: SESSION_ID_PART_${i + 1}\nValue:\n${p}\n`));
      }
      console.log("Extra accounts: SESSION_ID_2, SESSION_ID_3 … or ONE variable SESSION_IDS (new lines / commas).");
    } else {
      const id = process.argv[3];
      if (!id) throw new Error("Usage: node index.js unpack <SESSION_ID> [outDir]");
      const out = path.resolve(process.argv[4] || path.join(__dirname, "auth_info_baileys", "main"));
      const { creds, files } = sessionCodec.decode(id);
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, "creds.json"), JSON.stringify(creds, null, 2));
      for (const [f, c] of Object.entries(files)) if (/^[\w.\-]+\.json$/.test(f)) fs.writeFileSync(path.join(out, f), JSON.stringify(c));
      console.log(`✅ Written to ${out}`);
    }
  } catch (e) { console.error("❌", e.message); console.error("Usage: node index.js pack <creds.json | auth-folder> [--full]"); process.exit(1); }
  process.exit(0);
}

// ================= Global Variables =================
const ownerNumber = (config.OWNER_NUMBER || "94707085822")
  .split(",")
  .map(n => n.replace(/[^0-9]/g, "").trim())
  .filter(Boolean);
const botName = "SHAVIYA XMD";
let activeSessions = new Set();
const reconnectingSessions = new Set();
const removedSessions = new Set();
const sentConnectMsg = new Set();
let _cachedWAVersion = null;


// ───────────────────── 4. OWNER COMMANDS (multi-session control) ─────────────────────
// .sessions · .addsession <id> · .delsession <name> · .restartsession <name>
(() => {
  const { cmd: regCmd } = require("./command");
  const strictOwner = (senderNumber, botNumber) => ownerNumber.includes(senderNumber) || senderNumber === botNumber;
  const api = () => global.shaviyaSessions;

  regCmd({ pattern: "sessions", alias: ["sessionlist", "multisession"], desc: "List all running sessions", category: "owner", react: "🧩", filename: __filename },
  async (conn, mek, m, { reply, senderNumber, botNumber }) => {
    if (!strictOwner(senderNumber, botNumber)) return reply("❌ Only the bot owner can use this command.");
    if (!api()) return reply("⚠️ Session manager is not ready yet.");
    const rows = api().list();
    if (!rows.length) return reply("No sessions loaded.");
    const lines = rows.map((s, i) =>
      `${i + 1}. ${s.online ? "🟢" : "🔴"} *${s.sessionId}*\n   📞 ${s.number || (s.jid ? s.jid.split(":")[0] : "—")}\n   🗄️ ${s.store} • ${s.source}`);
    reply(`🧩 *SESSIONS* (${rows.length}/${api().max})\n\n${lines.join("\n\n")}`);
  });

  regCmd({ pattern: "addsession", alias: ["addbot"], desc: "Add a new session without restart (owner only)", category: "owner", react: "➕", filename: __filename },
  async (conn, mek, m, { from, q, reply, senderNumber, botNumber }) => {
    if (!strictOwner(senderNumber, botNumber)) return reply("❌ Only the bot owner can use this command.");
    if (!api()) return reply("⚠️ Session manager is not ready yet.");
    if (!q) return reply("Usage: *.addsession <SESSION_ID>*\n\nSupports SHAVIYA~… compact IDs, base64 and MEGA IDs.");
    try {
      const info = await api().add(q.trim());
      try { await conn.sendMessage(from, { delete: mek.key }); } catch (_) {}   // message holds credentials
      reply(`✅ Session added\n\n🆔 *${info.sessionId}*\n📞 ${info.number}\n🗄️ ${info.store}\n\n_Your message with the session ID was deleted if possible._`);
    } catch (e) { reply("❌ " + e.message); }
  });

  regCmd({ pattern: "delsession", alias: ["removesession"], desc: "Stop and delete a session (owner only)", category: "owner", react: "🗑️", filename: __filename },
  async (conn, mek, m, { q, reply, senderNumber, botNumber, sessionId }) => {
    if (!strictOwner(senderNumber, botNumber)) return reply("❌ Only the bot owner can use this command.");
    if (!api()) return reply("⚠️ Session manager is not ready yet.");
    const name = (q || "").trim();
    if (!name) return reply("Usage: *.delsession <name>*  (see *.sessions*)");
    if (name === sessionId) return reply("⚠️ You cannot delete the session you are chatting with. Use another session.");
    try { await api().remove(name); reply(`🗑️ Session *${name}* stopped and its stored data deleted.`); }
    catch (e) { reply("❌ " + e.message); }
  });

  regCmd({ pattern: "restartsession", desc: "Reconnect one session (owner only)", category: "owner", react: "🔄", filename: __filename },
  async (conn, mek, m, { q, reply, senderNumber, botNumber }) => {
    if (!strictOwner(senderNumber, botNumber)) return reply("❌ Only the bot owner can use this command.");
    if (!api()) return reply("⚠️ Session manager is not ready yet.");
    const name = (q || "").trim();
    if (!name) return reply("Usage: *.restartsession <name>*");
    try { await api().restart(name); reply(`🔄 Session *${name}* is reconnecting…`); }
    catch (e) { reply("❌ " + e.message); }
  });
})();

// ================= Bot Context (Fake ID) =================
const chama = {
  key: { remoteJid:"status@broadcast", participant:"0@s.whatsapp.net", fromMe:false, id:"META_AI_FAKE_ID_TS" },
  message: {
    contactMessage: {
      displayName: botName,
      vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${botName};;;;\nFN:${botName}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=94707085822:+94707085822\nEND:VCARD`,
    },
  },
};

// ====================== BOOT HELPERS ======================
function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Session loading (SESSION_ID / SESSION_ID_2.. / SESSION_IDS / MEGA / compact SHAVIYA~)
// is handled by lib/session-manager.js
async function ensureBotFiles() {
  ["plugins","lib","data","cookies","auth_info_baileys"].forEach(f =>
    ensureDirSync(path.join(__dirname, f))
  );
  console.log("[SHAVIYA-XMD] Local folders verified.");
}

// ================= Body Extractor =================
function extractBody(message) {
  if (!message) return "";
  const type = getContentType(message);
  if (type === "conversation")               return message.conversation || "";
  if (type === "extendedTextMessage")        return message.extendedTextMessage?.text || "";
  if (type === "buttonsResponseMessage")     return message.buttonsResponseMessage?.selectedButtonId || "";
  if (type === "listResponseMessage")        return message.listResponseMessage?.singleSelectReply?.selectedRowId || "";
  if (type === "templateButtonReplyMessage") return message.templateButtonReplyMessage?.selectedId || "";
  if (type === "interactiveResponseMessage") {
    try {
      const nativeReply = message.interactiveResponseMessage?.nativeFlowResponseMessage;
      if (nativeReply) {
        const parsed = JSON.parse(nativeReply.paramsJson || "{}");
        return parsed.id || nativeReply.name || "";
      }
    } catch {}
    return message.interactiveResponseMessage?.body?.text || "";
  }
  if (type === "imageMessage") return message.imageMessage?.caption || "";
  if (type === "videoMessage") return message.videoMessage?.caption || "";
  return "";
}

// ================= Global Button State =================
const buttonStateMap = new Map();
const buttonStateDir = path.join(__dirname, "./data");

function getButtonStateFile(sid) {
  return path.join(buttonStateDir, "button_state_" + sid + ".json");
}

global.isButtonEnabled = function(sessionId) {
  if (buttonStateMap.has(sessionId)) return buttonStateMap.get(sessionId);
  try {
    const file = getButtonStateFile(sessionId);
    if (fs.existsSync(file)) {
      const val = JSON.parse(fs.readFileSync(file, "utf8")).enabled;
      buttonStateMap.set(sessionId, val);
      return val;
    }
  } catch {}
  return true;
};

global.setButtonState = function(sessionId, value) {
  buttonStateMap.set(sessionId, value);
  try {
    if (!fs.existsSync(buttonStateDir)) fs.mkdirSync(buttonStateDir, { recursive: true });
    fs.writeFileSync(getButtonStateFile(sessionId), JSON.stringify({ enabled: value }, null, 2));
  } catch (e) { console.error("Button state save error:", e.message); }
};

function buildFallback(options) {
  let text = "";
  if (options.header) text += `*${options.header}*\n\n`;
  text += (options.body || "");
  if (options.buttons?.length) {
    text += "\n\n";
    options.buttons.forEach((b, i) => { text += `*${i + 1}.* ${b.text}\n`; });
    text += "\n_Reply with number_";
  }
  if (options.sections?.length) {
    text += "\n\n";
    let c = 1;
    options.sections.forEach(sec => {
      if (sec.title) text += `*${sec.title}*\n`;
      sec.rows?.forEach(row => {
        text += `*${c}.* ${row.title}`;
        if (row.description) text += ` — ${row.description}`;
        text += "\n";
        c++;
      });
    });
    text += "\n_Reply with number_";
  }
  if (options.footer) text += `\n\n${options.footer}`;
  return text;
}

global.sendInteractiveButtons = async function(conn, jid, options, quotedMsg) {
  const _sid = options._sessionId;
  if (!global.isButtonEnabled(_sid)) {
    return await conn.sendMessage(jid, { text: buildFallback(options) }, { quoted: quotedMsg });
  }
  try {
    const buttons = [];
    if (options.buttons?.length) {
      options.buttons.forEach(btn => {
        buttons.push({ name: "cta_reply", buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id }) });
      });
    }
    if (options.sections?.length) {
      buttons.push({ name: "single_select", buttonParamsJson: JSON.stringify({ title: options.listTitle || "Select", sections: options.sections }) });
    }
    if (options.url) {
      buttons.push({ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: options.url.text || "Open Link", url: options.url.link, merchant_url: options.url.link }) });
    }
    if (options.copy) {
      buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: options.copy.text || "Copy", copy_code: options.copy.value }) });
    }
    const interactiveMsg = generateWAMessageFromContent(jid, {
      messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
      interactiveMessage: proto.Message.InteractiveMessage.create({
        body:   proto.Message.InteractiveMessage.Body.create({ text: options.body || "" }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: options.footer || botName }),
        header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false, title: options.header || "" }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons, messageParamsJson: "" })
      })
    }, { quoted: quotedMsg, userJid: conn.user?.id });
    await conn.relayMessage(jid, interactiveMsg.message, { messageId: interactiveMsg.key.id });
    return interactiveMsg;
  } catch (err) {
    console.error("Interactive Button Error:", err.message);
    return await conn.sendMessage(jid, { text: buildFallback(options) }, { quoted: quotedMsg });
  }
};

// ================= Anti-Spam Cooldown (Private Mode) =================
const _accessDeniedCooldown = new Map();
const ACCESS_DENIED_COOLDOWN_MS = 60 * 1000;

function shouldSendDenied(sid, num) {
  const key = `${sid}:${num}`;
  const last = _accessDeniedCooldown.get(key) || 0;
  if (Date.now() - last < ACCESS_DENIED_COOLDOWN_MS) return false;
  _accessDeniedCooldown.set(key, Date.now());
  return true;
}

// ================= Single Bot Instance Start =================
async function startBot(sessionId, authPath, envConfig) {
  if (activeSessions.has(sessionId)) return;
  activeSessions.add(sessionId);

  const prefix = envConfig?.PREFIX || ".";
  const { state, saveCreds } = await sessionManager.getAuthState(sessionId, authPath);
  if (!_cachedWAVersion) {
    try { const r = await fetchLatestBaileysVersion(); _cachedWAVersion = r.version; }
    catch (_) { _cachedWAVersion = [2, 3000, 1015901307]; }
  }
  const version = _cachedWAVersion;

  const conn = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: false,
    auth: state,
    version,
    getMessage: async (key) => {
      return { conversation: "" };
    },
    shouldIgnoreJid: (jid) => false,
  });

  console.log(`Starting session: ${sessionId}`);

  if (!global._activeConns) global._activeConns = new Map();
  global._activeConns.set(sessionId, conn);

  initAntiCrash(conn, sessionId, ownerNumber);

  conn.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      activeSessions.delete(sessionId);

      // session removed by owner (.delsession) → do not reconnect
      if (removedSessions.has(sessionId)) {
        console.log(`Session stopped: ${sessionId}`);
        return;
      }

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(`Logged Out: ${sessionId} — stored session data removed. Re-pair and set a new SESSION_ID.`);
        try { await sessionManager.remove(sessionId); } catch (_) {}
        global._activeConns?.delete(sessionId);
        return;
      }

      if (statusCode === DisconnectReason.connectionReplaced) {
        // same session opened somewhere else (e.g. another runner) → don't fight for it
        console.log(`Connection replaced: ${sessionId} — retrying in 60s (is another instance running?)`);
        reconnectingSessions.add(sessionId);
        setTimeout(async () => {
          await startBot(sessionId, authPath, envConfig);
          reconnectingSessions.delete(sessionId);
        }, 60000);
        return;
      }

      console.log(`Reconnecting: ${sessionId} (code ${statusCode ?? "n/a"})`);
      reconnectingSessions.add(sessionId);
      setTimeout(async () => {
        await startBot(sessionId, authPath, envConfig);
        reconnectingSessions.delete(sessionId);
      }, 8000);
    } else if (connection === "open") {
      console.log(`Connected: ${sessionId} (${conn.user.id.split(":")[0]})`);
      if (!global._activeConns) global._activeConns = new Map();
      global._activeConns.set(sessionId, conn);
      if (typeof global.attachCinesubzListener === 'function') {
        global.attachCinesubzListener(conn, sessionId);
      }

      try {
        const { getSetting } = require('./lib/settings');
        const alwaysOffline = getSetting('alwaysOffline');
        if (alwaysOffline === true || alwaysOffline === 'true') {
          conn.sendPresenceUpdate('unavailable').catch(() => {});
        }
      } catch (e) {}

      if (!sentConnectMsg.has(sessionId)) {
        sentConnectMsg.add(sessionId);
        ;(async () => {
          try {
            await new Promise(r => setTimeout(r, 3000));

            const now = new Date().toLocaleString('en-US', {
              timeZone: 'Asia/Colombo',
              hour: '2-digit', minute: '2-digit',
              day: '2-digit', month: 'short', year: 'numeric'
            });

            const botNum = conn.user.id.split(":")[0];
            const modeStr = (config.MODE || "public").toUpperCase();
            const selfJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";

            let pluginCount = 0;
            try {
              pluginCount = fs
                .readdirSync(path.join(__dirname, "plugins"))
                .filter(f => f.endsWith(".js")).length;
            } catch (e) {}

            const uptimeSec = Math.floor(process.uptime());
            const uptimeStr =
              `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`;

            const upMsg =
`╭━━━〔 🌖 *SHAVIYA-XMD* 〕━━━╮
┃
┃  ✅ *Connected Successfully*
┃
┃  👤 *Number*    : ${botNum}
┃  ⚙️ *Mode*      : ${modeStr}
┃  🔣 *Prefix*    : [ ${prefix} ]
┃  🧩 *Plugins*   : ${pluginCount}
┃  📦 *Version*   : V2.0
┃  ☁️ *Host*      : Heroku
┃  ⏱️ *Uptime*    : ${uptimeStr}
┃  📅 *Started*   : ${now}
┃
╰━━━━━━━━━━━━━━━━━━━━━╯

  💡 Type *${prefix}menu* to see all commands

     ── *Shaviya-Xmd* • Powered with 🖤 ──`;

            const connectImageUrl = "https://whiteshadow-uploader.vercel.app/files/cui.jpg";
            const contextInfo = {
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: 'shavi%',
                newsletterName: "🌖 SHAVIYA-XMD",
                serverMessageId: 143
              }
            };

            try {
              // Pre-fetch the image ourselves so a dead/slow host can't hang or break sendMessage.
              const axios = require('axios');
              const imgRes = await axios.get(connectImageUrl, {
                responseType: 'arraybuffer',
                timeout: 8000
              });

              await conn.sendMessage(
                selfJid,
                {
                  image: Buffer.from(imgRes.data),
                  caption: upMsg,
                  contextInfo
                },
                { quoted: chama }
              );
            } catch (imgErr) {
              console.log(`[CONNECT MSG] Image fetch/send failed (${imgErr.message}), falling back to text-only.`);
              try {
                await conn.sendMessage(
                  selfJid,
                  {
                    text: upMsg,
                    contextInfo
                  },
                  { quoted: chama }
                );
              } catch (e) {
                console.log(`[CONNECT MSG] Failed to send: ${e.message}`);
              }
            }
          } catch (e) {
            console.log(`[CONNECT MSG] Failed to send: ${e.message}`);
          }
          try { await conn.newsletterFollow(`0029Vb7Cx5gJENxwXCJaXk2I@newsletter`); } catch (e) {}
        })();
      }
    }
  });

  conn.ev.on("creds.update", saveCreds);

  conn.ev.on("messages.update", (updates) => {
    if (antidelete) antidelete.onDelete(conn, updates, sessionId).catch(() => {});
  });

  const { getSetting: _getSettingStatus } = require("./lib/settings");

  conn.ev.on("messages.upsert", (mkk) => {
    const { messages, type } = mkk;

    // ── STATUS PATH ──
    const autoRead = _getSettingStatus("autoStatusRead");
    const autoLike = _getSettingStatus("autoStatusLike");
    for (const mek of messages) {
      if (mek?.key?.remoteJid !== "status@broadcast") continue;
      if (mek.key.fromMe) continue;
      if (!mek.key.id) continue;

      if (autoRead !== false && autoRead !== "false") {
        conn.readMessages([mek.key]).catch(() => {});
      }

      if (autoLike !== false && autoLike !== "false" && autoLike) {
        const statusSender = mek.key.participant || mek.key.remoteJid;
        const msg = mek.message || {};
        const msgType = Object.keys(msg)[0] || "";
        const isProtocol = (
          msgType === "senderKeyDistributionMessage" ||
          msgType === "protocolMessage"             ||
          msgType === "messageContextInfo"
        );
        if (!isProtocol && statusSender) {
          setTimeout(() => {
            const { getSetting: _getEmoji } = require("./lib/settings");
            const reactEmoji = _getEmoji("autoStatusEmoji") || "❤️";
            conn.sendMessage(
              "status@broadcast",
              { react: { text: reactEmoji, key: { remoteJid: "status@broadcast", id: mek.key.id, participant: statusSender, fromMe: false } } },
              { statusJidList: [statusSender] }
            ).catch(() => {});
          }, 1500);
        }
      }
    }

    // ── CMD PATH ──
    if (type !== "notify" && type !== "append") return;
    const nonStatusMessages = messages.filter(
      m => m?.key?.remoteJid !== "status@broadcast"
    );
    if (nonStatusMessages.length === 0) return;

    (async (mkk) => {
    try {
      let mek = mkk.messages[0];
      if (!mek?.key) return;
      if (!mek?.message) return;

      const msgKeys = Object.keys(mek.message);
      if (
        msgKeys.includes("senderKeyDistributionMessage") ||
        msgKeys.includes("protocolMessage") ||
        (msgKeys.length === 1 && msgKeys[0] === "messageContextInfo")
      ) return;

      if (mek.key.remoteJid === "status@broadcast") return;

      // ── Antidelete cache ──
      if (antidelete) antidelete.onMessage(conn, mek, sessionId).catch(() => {});

      // ✅ Unwrap ephemeralMessage AND deviceSentMessage
      {
        const _type = getContentType(mek.message);
        if (_type === "ephemeralMessage") {
          mek.message = mek.message.ephemeralMessage?.message || mek.message;
        } else if (_type === "deviceSentMessage") {
          mek.message = mek.message.deviceSentMessage?.message || mek.message;
        }
      }

      if (!mek.message) return;

      // ── AutoForward ──
      if (handleAutoForward) handleAutoForward(conn, mek, sessionId).catch(() => {});

      const m    = sms(conn, mek);
      const from = mek.key.remoteJid;
      if (!from) return;

      const body        = extractBody(mek.message);
      const isCmd       = body.startsWith(prefix);
      const commandText = isCmd ? body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase() : "";
      const args        = body.trim().split(/ +/).slice(1);
      const q           = args.join(" ");

      // ── LID-safe sender extraction ──
      let sender = mek.key.fromMe
        ? conn.user.id.split(":")[0] + "@s.whatsapp.net"
        : mek.key.participant || mek.key.remoteJid;

      if (sender && sender.endsWith("@lid")) {
        try {
          const contacts = conn.contacts || {};
          const resolved = Object.values(contacts).find(c =>
            c.lid && c.lid.split("@")[0] === sender.split("@")[0] && c.id && c.id.endsWith("@s.whatsapp.net")
          );
          if (resolved?.id) sender = resolved.id;
        } catch {}
      }

      const senderNumber = sender.split("@")[0].split(":")[0];
      const botNumber    = conn.user.id.split(":")[0].split("@")[0];
      const pushname     = mek.pushName || senderNumber || "User";
      const isSudo       = typeof global.isSudoUser === "function" && global.isSudoUser(sessionId, senderNumber);
      const isOwner      = ownerNumber.includes(senderNumber) || botNumber === senderNumber || isSudo;
      const reply        = (text) => conn.sendMessage(from, { text }, { quoted: mek });

      // ── Owner react ──
      if (isOwner && !mek.key.fromMe && !isCmd) {
        conn.sendMessage(from, { react: { text: "👑", key: mek.key } }).catch(() => {});
      }

      if (isCmd) console.log(`[CMD] ${sessionId} | ${commandText} | sender: ${senderNumber} | isOwner: ${isOwner}`);

      // ── Access Control ──
      const _hasActiveState = typeof global._cinesubzHasState === "function"
        ? global._cinesubzHasState(from, sessionId)
        : false;

      if (!isOwner && !_hasActiveState && typeof global.checkAccess === "function") {
        const isGroup = from.endsWith("@g.us");
        const access  = global.checkAccess(sessionId, senderNumber, isOwner, isGroup);
        if (!access.allowed) {
          if (isCmd && shouldSendDenied(sessionId, senderNumber)) {
            conn.sendMessage(from, { text: access.reason }, { quoted: mek }).catch(() => {});
          }
          return;
        }
      }

      // ── Built-in Restart ──
      if (isCmd && commandText === "restart") {
        if (!isOwner) return reply("❌ Only the bot owner can use this command.");
        await conn.sendMessage(from, { text: "🔄 *SHAVIYA-XMD* is restarting...\n\n_Please wait a few seconds._" }, { quoted: mek });
        setTimeout(() => process.exit(0), 2000);
        return;
      }

      conn.sendButton = (jid, options, quoted) =>
        global.sendInteractiveButtons(conn, jid, { ...options, _sessionId: sessionId }, quoted || mek);

      const events = require("./command");

      if (!global._pluginsLoaded || events.commands.length === 0) {
        (async () => {
          let tries = 0;
          while ((!global._pluginsLoaded || require("./command").commands.length === 0) && tries < 20) {
            await new Promise(r => setTimeout(r, 500));
            tries++;
          }
          const ev2 = require("./command");
          if (!ev2.commands.length) return;
          const cmd2 = ev2.commands.find(c => c.pattern === commandText || (c.alias && c.alias.includes(commandText)));
          if (cmd2) {
            if (cmd2.react) conn.sendMessage(from, { react: { text: cmd2.react, key: mek.key } }).catch(() => {});
            try {
              await cmd2.function(conn, mek, m, { from, body, isCmd, command: commandText, args, q, sender, senderNumber, botNumber, isOwner, isSudo, pushname, reply, sessionId });
            } catch (e) { console.error(`[CMD RETRY ERROR] ${sessionId}:`, e.message); }
          }
        })().catch(e => console.error(`[CMD WAIT ERROR] ${sessionId}:`, e.message));
        return;
      }

      const cmd = events.commands.find(c => c.pattern === commandText || (c.alias && c.alias.includes(commandText)));

      if (cmd) {
        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } }).catch(() => {});
        try {
          await cmd.function(conn, mek, m, { from, body, isCmd, command: commandText, args, q, sender, senderNumber, botNumber, isOwner, isSudo, pushname, reply, sessionId });
        } catch (err) {
          console.error(`[CMD ERROR] ${sessionId}:`, err);
        }
      }

      // ── on:"body" handlers ──
      const bodyHandlers = events.commands.filter(c => c.on === "body");
      if (bodyHandlers.length > 0) {
        Promise.allSettled(
          bodyHandlers.map(h =>
            h.function(conn, mek, m, { from, body, isCmd, command: commandText, args, q, sender, senderNumber, botNumber, isOwner, isSudo, pushname, reply, sessionId })
          )
        ).catch(() => {});
      }

    } catch (err) {
      if (!err.message?.includes("Bad MAC") && !err.message?.includes("decrypt")) {
        console.error(`[MSG ERROR] ${sessionId}:`, err.message);
      }
    }
  })({ messages: nonStatusMessages, type }).catch(() => {});
  });
}

// ================= Express Server =================
const app  = express();
const port = process.env.PORT || 8000;
app.get("/", (req, res) => res.send(`💎 SHAVIYA-XMD is Running ✅ | Active sessions: ${activeSessions.size}`));
app.listen(port, () => console.log(`🚀 SHAVIYA-XMD Server running on port ${port}`));

// ================= Plugin Loader =================
function loadPlugins() {
  if (global._pluginsLoaded) return;
  global._pluginsLoaded = true;
  const pluginFolder = "./plugins/";
  let loadedCount = 0;
  if (fs.existsSync(pluginFolder)) {
    fs.readdirSync(pluginFolder).forEach(plugin => {
      if (path.extname(plugin).toLowerCase() === ".js") {
        try {
          delete require.cache[require.resolve(pluginFolder + plugin)];
          require(pluginFolder + plugin);
          loadedCount++;
        } catch (e) { console.log(`Plugin load error [${plugin}]:`, e.message); }
      }
    });
  }
  console.log(`✅ Loaded ${loadedCount} plugins, ${require("./command").commands.length} commands`);

  if (typeof global.attachCinesubzListener === 'function') {
    for (const [sessionId, conn] of global._activeConns || []) {
      try {
        global.attachCinesubzListener(conn, sessionId);
        console.log(`[CINESUBZ] Listener attached for session: ${sessionId}`);
      } catch (e) {}
    }
  }
}

// ================= Main Connector =================
async function connectToWA() {
  try {
    const envConfig = config;
    const sessions = sessionManager.list();
    if (sessions.length === 0) {
      console.log("No sessions found.");
      console.log("→ Set SESSION_ID (or SESSION_ID_2.., SESSION_IDS) and restart. Use `npm run session:pack` for a compact ID.");
      setTimeout(() => loadPlugins(), 1000);
      return;
    }
    // staggered start — avoids WhatsApp rate limits when many sessions boot together
    for (const s of sessions) {
      await startBot(s.sessionId, s.authPath, envConfig);
      if (sessions.length > 1) await new Promise(r => setTimeout(r, 2500));
    }
    console.log(`✅ Started ${sessions.length} session(s).`);
    setTimeout(() => loadPlugins(), 3000);
  } catch (err) {
    console.error("Startup Error:", err);
  }
}

// ================= Multi-session control (used by plugins/sessions.js) =================
global.shaviyaSessions = {
  list: () => sessionManager.list().map(s => ({
    ...s,
    online: !!global._activeConns?.get(s.sessionId)?.user,
    jid: global._activeConns?.get(s.sessionId)?.user?.id || null,
  })),
  add: async (raw) => {
    const info = await sessionManager.add(raw);
    removedSessions.delete(info.sessionId);
    await loadSettingsFromDB(info.sessionId).catch(() => {});
    await startBot(info.sessionId, info.authPath, config);
    return info;
  },
  remove: async (name) => {
    removedSessions.add(name);
    const conn = global._activeConns?.get(name);
    try { conn?.end?.(undefined); } catch (_) {}
    global._activeConns?.delete(name);
    activeSessions.delete(name);
    return sessionManager.remove(name);
  },
  restart: async (name) => {
    const s = sessionManager.get(name);
    if (!s) throw new Error(`No such session: ${name}`);
    const conn = global._activeConns?.get(name);
    try { conn?.end?.(undefined); } catch (_) {}
    return true; // connection.close handler reconnects automatically
  },
  max: sessionManager.MAX_SESSIONS,
};

// ================= START =================
setTimeout(async () => {
  await ensureBotFiles();
  try {
    sms        = require("./lib/msg").sms;
    antidelete = require("./plugins/antidelete");
    try { handleAutoForward = require("./plugins/forward").handleAutoForward; } catch {}
    console.log("Lib modules loaded successfully.");
  } catch (e) {
    console.error("Lib load error:", e.message);
    process.exit(1);
  }
  await connectDB();                       // MongoDB first (session state lives there)
  const _sessions = await sessionManager.init();
  await Promise.all(_sessions.map(s => loadSettingsFromDB(s.sessionId)));
  await connectToWA();
}, 500);
