const { cmd } = require("../command");

// ══════════════════════════════════════════════════════════════
//  .vv / vv — Silent View-Once Retrieval (OWNER ONLY)
//  Works with OR without prefix, fully silent
// ══════════════════════════════════════════════════════════════

if (!global._vvRecent) global._vvRecent = new Set();

async function retrieveViewOnce(conn, m) {
  try {
    if (!m.quoted) return false;

    const buffer = await m.quoted.download();
    const type = m.quoted.type;
    const target = m.sender;

    if (type === "imageMessage") {
      await conn.sendMessage(target, {
        image: buffer,
        caption: m.quoted.msg?.caption || ""
      });
      return true;
    }

    if (type === "videoMessage") {
      await conn.sendMessage(target, {
        video: buffer,
        caption: m.quoted.msg?.caption || ""
      });
      return true;
    }

    if (type === "audioMessage") {
      await conn.sendMessage(target, {
        audio: buffer,
        mimetype: "audio/mpeg",
        ptt: false
      });
      return true;
    }

    return false;

  } catch (err) {
    console.log("[VV] Error:", err.message);
    return false;
  }
}

cmd({
  pattern: "vv",
  alias: ["viewonce", "retrieve"],
  on: "body",
  desc: "Retrieve View Once silently (Owner only)",
  category: "tools",
  filename: __filename
}, async (conn, m, match, opts) => {
  try {
    const { body, isCmd, command, isOwner } = opts || {};

    // 🔒 OWNER ONLY — silent skip for non-owners
    if (!isOwner) return;

    const msgId = m?.key?.id;
    if (!msgId) return;
    if (global._vvRecent.has(msgId)) return;

    // Trigger check
    let trigger = false;

    if (isCmd) {
      const cmdName = (command || "").toLowerCase();
      if (cmdName === "vv" || cmdName === "viewonce" || cmdName === "retrieve") {
        trigger = true;
      }
    } else {
      const clean = (body || "").trim().toLowerCase();
      if (clean === "vv" || clean === "viewonce" || clean === "retrieve") {
        trigger = true;
      }
    }

    if (!trigger) return;
    if (!m.quoted) return;

    // Dedupe
    global._vvRecent.add(msgId);
    setTimeout(() => global._vvRecent.delete(msgId), 60000);
    if (global._vvRecent.size > 500) {
      const arr = Array.from(global._vvRecent);
      global._vvRecent = new Set(arr.slice(-200));
    }

    // 🔇 Silent retrieve
    await retrieveViewOnce(conn, m);

  } catch (err) {
    console.log("[VV] Error:", err.message);
  }
});
