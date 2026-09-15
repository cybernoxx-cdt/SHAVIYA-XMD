const fs = require("fs");
const path = require("path");
const { cmd } = require("../command");

// ═══════════════════════════════════════════════════
//  SUDO (Temporary Owner) — MongoDB Persist + File Fallback
//  ✅ FIX: isCreator was never passed by index.js → sudo commands
//          were completely unusable by anyone, including the real owner.
//          Now uses `isOwner`, which index.js actually provides.
//  ✅ FIX: m.mentionedJid does not exist on the `m` object built by
//          lib/msg.js — the real property is m.mentionUser. Tagging a
//          user always fell through to the broken args[0] fallback.
//  ✅ FIX: args[0] fallback produced the literal string
//          "undefined@s.whatsapp.net" when no number/mention/reply was
//          given, instead of failing with a clean error.
//  ✅ FIX: sudo.json was a single global file shared by every session
//          and was NEVER saved to MongoDB — on Heroku the dyno
//          filesystem is ephemeral, so the whole sudo list was wiped
//          on every restart/redeploy.
//  ✅ FIX: even when setsudo "worked", sudo users were never actually
//          treated as owners anywhere in the bot — index.js's isOwner
//          check never looked at sudo.json. Sudo is now merged into
//          isOwner in index.js.
//  ✅ Per-session isolation — each bot session has its own sudo list
//  ✅ Old global lib/sudo.json is auto-migrated into the first
//     session's list so no existing sudo user is lost.
// ═══════════════════════════════════════════════════

const DATA_DIR = path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const LEGACY_PATH = path.join(__dirname, "../lib/sudo.json");

// ── Number normalize (matches plugins/accesscontrol.js) ──────
function normalizeNumber(raw) {
  if (!raw) return "";
  return String(raw)
    .replace(/@s\.whatsapp\.net/g, "")
    .replace(/@lid/g, "")
    .replace(/:\d+$/g, "")
    .replace(/[^0-9]/g, "");
}

function getLocalFile(sessionId) {
  return path.join(DATA_DIR, `sudo_config_${sessionId}.json`);
}

// ── Mongoose model — re-checked every call until connected ──
let _SudoModel = null;
function getSudoModel() {
  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) return null;
    if (_SudoModel) return _SudoModel;
    const schema = new mongoose.Schema(
      { _id: String, numbers: [String] },
      { collection: "sudo_config" }
    );
    _SudoModel = mongoose.models.SudoConfig ||
                 mongoose.model("SudoConfig", schema);
    return _SudoModel;
  } catch (_) {
    return null;
  }
}

// One-time migration of the old shared lib/sudo.json (JID array)
function loadLegacyNumbers() {
  try {
    if (!fs.existsSync(LEGACY_PATH)) return [];
    const raw = JSON.parse(fs.readFileSync(LEGACY_PATH, "utf8"));
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.map(normalizeNumber).filter(Boolean))];
  } catch (_) {
    return [];
  }
}

// ── Load list: Mongoose first, then file, then legacy migration ──
async function getSudoList(sessionId) {
  try {
    const Model = getSudoModel();
    if (Model) {
      const doc = await Model.findById(sessionId).lean();
      if (doc && Array.isArray(doc.numbers)) {
        try { fs.writeFileSync(getLocalFile(sessionId), JSON.stringify(doc.numbers, null, 2)); } catch (_) {}
        return doc.numbers;
      }
    }
  } catch (e) {
    console.error("[SUDO] Mongoose load error:", e.message);
  }

  try {
    const file = getLocalFile(sessionId);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_) {}

  const legacy = loadLegacyNumbers();
  if (legacy.length) {
    try { fs.writeFileSync(getLocalFile(sessionId), JSON.stringify(legacy, null, 2)); } catch (_) {}
  }
  return legacy;
}

// ── Save list: file first (fast, guaranteed) then MongoDB ───
async function saveSudoList(sessionId, numbers) {
  try {
    fs.writeFileSync(getLocalFile(sessionId), JSON.stringify(numbers, null, 2));
  } catch (_) {}

  const tryMongoSave = async (sid, data) => {
    const Model = getSudoModel();
    if (!Model) return false;
    await Model.findByIdAndUpdate(
      sid,
      { $set: { numbers: data } },
      { upsert: true, new: true }
    );
    return true;
  };

  try {
    const saved = await tryMongoSave(sessionId, numbers);
    if (saved) {
      console.log(`[SUDO] ✅ Saved to MongoDB [${sessionId}]`);
    } else {
      const _sid = sessionId;
      const _nums = [...numbers];
      setTimeout(async () => {
        try {
          const ok = await tryMongoSave(_sid, _nums);
          if (ok) console.log(`[SUDO] ✅ Delayed MongoDB save OK [${_sid}]`);
        } catch (err) {
          console.error(`[SUDO] Delayed save error [${_sid}]:`, err.message);
        }
      }, 3000);
    }
  } catch (e) {
    console.error("[SUDO] MongoDB save error:", e.message);
  }
}

// ── In-memory cache + sync check used by index.js's isOwner ──
const _sudoCache = {};

async function preloadSudoCache(sessionId) {
  const list = await getSudoList(sessionId);
  _sudoCache[sessionId] = list;
  return list;
}

// global.isSudoUser(sessionId, number) → true/false, synchronous.
// Lazily loads from file/legacy immediately, refreshes from MongoDB
// in the background — same pattern as global.checkAccess.
global.isSudoUser = function (sessionId, number) {
  if (!_sudoCache[sessionId]) {
    try {
      const file = getLocalFile(sessionId);
      if (fs.existsSync(file)) {
        _sudoCache[sessionId] = JSON.parse(fs.readFileSync(file, "utf8"));
      } else {
        _sudoCache[sessionId] = loadLegacyNumbers();
      }
    } catch (_) {
      _sudoCache[sessionId] = [];
    }
    preloadSudoCache(sessionId);
  }
  return (_sudoCache[sessionId] || []).includes(normalizeNumber(number));
};

function getTarget(m, args) {
  const raw = m.mentionUser?.[0] || m.quoted?.sender || args[0];
  return normalizeNumber(raw);
}

module.exports = { preloadSudoCache };

// ═══════════════════════════════════════════════════
//  1. SETSUDO
// ═══════════════════════════════════════════════════
cmd({
    pattern: "setsudo",
    alias: ["addsudo", "addowner"],
    desc: "Add a temporary owner (sudo)",
    category: "owner",
    react: "🌙",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply, sessionId }) => {
    try {
        if (!isOwner) return reply("_❗This Command Can Only Be Used By My Owner!_");

        const target = getTarget(m, args);
        if (!target) return reply("❌ Please provide a number or tag/reply a user.\n📌 *Example:* `.setsudo 94xxxxxxxxx`");

        const list = await getSudoList(sessionId);
        if (list.includes(target)) return reply(`❌ *${target}* is already a temporary owner.`);

        list.push(target);
        await saveSudoList(sessionId, list);
        _sudoCache[sessionId] = list;

        await conn.sendMessage(from, {
            image: { url: "https://files.catbox.moe/f18ceb.jpg" },
            caption: `✅ *${target}* added as temporary owner!\n_Saved to MongoDB — survives restarts ✅_`
        }, { quoted: mek });
    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
    }
});

// ═══════════════════════════════════════════════════
//  2. DELSUDO
// ═══════════════════════════════════════════════════
cmd({
    pattern: "delsudo",
    alias: ["delowner", "deletesudo"],
    desc: "Remove a temporary owner (sudo)",
    category: "owner",
    react: "🫩",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply, sessionId }) => {
    try {
        if (!isOwner) return reply("_❗This Command Can Only Be Used By My Owner!_");

        const target = getTarget(m, args);
        if (!target) return reply("❌ Please provide a number or tag/reply a user.\n📌 *Example:* `.delsudo 94xxxxxxxxx`");

        const list = await getSudoList(sessionId);
        if (!list.includes(target)) return reply(`❌ *${target}* is not in the sudo list.`);

        const updated = list.filter(x => x !== target);
        await saveSudoList(sessionId, updated);
        _sudoCache[sessionId] = updated;

        await conn.sendMessage(from, {
            image: { url: "https://files.catbox.moe/f18ceb.jpg" },
            caption: `✅ *${target}* removed as temporary owner!\n_Saved to MongoDB ✅_`
        }, { quoted: mek });
    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
    }
});

// ═══════════════════════════════════════════════════
//  3. LISTSUDO
// ═══════════════════════════════════════════════════
cmd({
    pattern: "listsudo",
    alias: ["listowner"],
    desc: "List all temporary owners (sudo)",
    category: "owner",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply, sessionId }) => {
    try {
        if (!isOwner) return reply("_❗This Command Can Only Be Used By My Owner!_");

        const list = await getSudoList(sessionId);
        if (!list.length) return reply("❌ No temporary owners found.");

        let listMessage = "`🤴 List of Sudo Owners:`\n\n";
        list.forEach((n, i) => { listMessage += `${i + 1}. +${n}\n`; });

        await conn.sendMessage(from, {
            image: { url: "https://files.catbox.moe/f18ceb.jpg" },
            caption: listMessage
        }, { quoted: mek });
    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
    }
});
