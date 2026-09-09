// plugins/novel.js — SHAVIYA-XMD | Sinhala Novel Search & Download (Zanta API)
const { cmd } = require('../command');
const axios = require('axios');

// ═══════════════════════════════════════════════════
//  API CONFIG (hardcoded)
// ═══════════════════════════════════════════════════
const API_KEY   = "zan_vWpU1lkr_g6wwxdlvyv";
const SEARCH_API = "https://api.zanta-mini.store/api/novel/search";
const DL_API     = "https://api.zanta-mini.store/api/novel/dl";

const SEARCH_URL = (q)   => `${SEARCH_API}?apiKey=${API_KEY}&url=${encodeURIComponent(q)}`;
const DL_URL      = (url) => `${DL_API}?apiKey=${API_KEY}&url=${encodeURIComponent(url)}`;

const FOOTER = "Sʜᴀᴠɪʏᴀ Xᴍᴅ © ⚜️";

// ═══════════════════════════════════════════════════
//  React helper
// ═══════════════════════════════════════════════════
async function react(conn, jid, key, emoji) {
  try { await conn.sendMessage(jid, { react: { text: emoji, key } }); } catch {}
}

// ═══════════════════════════════════════════════════
//  waitForReply - listens for a quoted reply to a specific message
// ═══════════════════════════════════════════════════
function waitForReply(conn, from, sender, replyToId, timeout = 120000) {
  return new Promise((resolve) => {
    let settled = false;

    const handler = (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message) return;
      const ctx = msg.message?.extendedTextMessage?.contextInfo;
      const text = msg.message.conversation || msg.message?.extendedTextMessage?.text || "";
      const msgSender = msg.key.participant || msg.key.remoteJid;
      const isCorrectUser = msgSender.includes(sender.split('@')[0]) || msgSender.includes("@lid");
      if (msg.key.remoteJid === from && isCorrectUser && ctx?.stanzaId === replyToId) {
        if (settled) return;
        settled = true;
        conn.ev.off("messages.upsert", handler);
        resolve({ msg, text: text.trim() });
      }
    };

    conn.ev.on("messages.upsert", handler);

    setTimeout(() => {
      if (settled) return;
      conn.ev.off("messages.upsert", handler);
      resolve(null);
    }, timeout);
  });
}

// ═══════════════════════════════════════════════════
//  NOVEL SEARCH + DOWNLOAD COMMAND
// ═══════════════════════════════════════════════════
cmd({
  pattern: "novel",
  alias: ["novelsearch", "ebook"],
  desc: "Search & Download Sinhala Novels (sinhalaebooks.com via Zanta API)",
  category: "downloader",
  react: "📖",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
  try {
    if (!q || !q.trim()) return reply("❗ *Example:* `.novel Shrungariye`");

    await react(conn, from, m.key, "🔍");

    // 1️⃣ SEARCH
    let results;
    try {
      const { data } = await axios.get(SEARCH_URL(q.trim()), { timeout: 20000 });
      if (!data?.success) throw new Error(data?.message || "search failed");
      results = data?.results;
    } catch (e) {
      await react(conn, from, m.key, "❌");
      return reply("❌ Search API error: " + (e?.response?.data?.message || e.message));
    }

    if (!results?.length) {
      await react(conn, from, m.key, "❌");
      return reply(`❌ *"${q}"* සඳහා නවකතා හමු නොවීය. වෙනත් නමකින් සොයන්න.`);
    }

    await react(conn, from, m.key, "📖");

    let listText = `📚 *Sinhala Novel Search Results*\n🔎 _${q}_\n\n`;
    results.slice(0, 10).forEach((v, i) => {
      listText += `*${i + 1}.* ${v.title}\n`;
    });
    listText += `\n📌 අංකයෙන් (1-${Math.min(results.length, 10)}) මෙම මැසේජ් එකට Reply කරන්න.\n\n${FOOTER}`;

    const listMsg = await conn.sendMessage(from, {
      image: { url: results[0].thumbnail },
      caption: listText
    }, { quoted: mek });

    // ── Selection loop ──
    while (true) {
      const sel = await waitForReply(conn, from, sender, listMsg.key.id);
      if (!sel) break;

      (async () => {
        const index = parseInt(sel.text) - 1;
        const chosen = results[index];
        if (isNaN(index) || !chosen) {
          return conn.sendMessage(from, { text: "❌ වලංගු අංකයක් ඇතුලත් කරන්න." }, { quoted: sel.msg });
        }

        await react(conn, from, sel.msg.key, "⏳");

        // 2️⃣ GET DOWNLOAD LINKS
        let dl;
        try {
          const { data } = await axios.get(DL_URL(chosen.url), { timeout: 20000 });
          if (!data?.success) throw new Error(data?.message || "download fetch failed");
          dl = data;
        } catch (e) {
          await react(conn, from, sel.msg.key, "❌");
          return conn.sendMessage(from, {
            text: "❌ Download API error: " + (e?.response?.data?.message || e.message)
          }, { quoted: sel.msg });
        }

        if (!dl.download_links?.length) {
          await react(conn, from, sel.msg.key, "❌");
          return conn.sendMessage(from, {
            text: `❌ *${dl.title || chosen.title}*\n\nDownload links හමු නොවීය.`
          }, { quoted: sel.msg });
        }

        let capText = `✅ *${dl.title || chosen.title}*\n\n`;
        dl.download_links.forEach((l, i) => {
          capText += `*${i + 1}.* ${l.label}\n${l.url}\n\n`;
        });
        capText += FOOTER;

        try {
          const sent = await conn.sendMessage(from, {
            image: { url: dl.thumbnail || chosen.thumbnail },
            caption: capText
          }, { quoted: sel.msg });
          await react(conn, from, sent.key, "✅");
        } catch (e) {
          await conn.sendMessage(from, { text: capText }, { quoted: sel.msg });
        }
      })();
    }

  } catch (e) {
    console.error("📛 NOVEL PLUGIN ERROR:", e);
    await react(conn, from, m.key, "❌");
    reply("⚠️ Error: " + e.message);
  }
});
