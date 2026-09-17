const { cmd } = require('../command');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════
//  API CONFIG (new provider — zanta-mini.store)
// ═══════════════════════════════════════════════════
const API_KEY   = "zan_vWpU1lkr_g6wwxdlvyv";
const API_BASE  = "https://api.zanta-mini.store/api/slcartoons";

const SEARCH_URL = (q)   => `${API_BASE}/search?apiKey=${API_KEY}&text=${encodeURIComponent(q)}`;
const DL_URL      = (url) => `${API_BASE}/dl?apiKey=${API_KEY}&text=${encodeURIComponent(url)}`;

// ═══════════════════════════════════════════════════
//  Brand
// ═══════════════════════════════════════════════════
const BRAND = "🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮";

// ═══════════════════════════════════════════════════
//  Session Config Helpers
// ═══════════════════════════════════════════════════
function getSessionConfig(sessionId) {
  try {
    const file = path.join(__dirname, `../data/session_config_${sessionId}.json`);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {}
  return {};
}

function getHardThumbUrl(sessionId) {
  return getSessionConfig(sessionId).thumbUrl ||
    "https://image2url.com/r2/default/images/1774184263251-f9306abd-80ec-4b38-830e-73649a3d687e.png";
}

// ═══════════════════════════════════════════════════
//  React helper
// ═══════════════════════════════════════════════════
async function react(conn, jid, key, emoji) {
  try { await conn.sendMessage(jid, { react: { text: emoji, key } }); } catch {}
}

// ═══════════════════════════════════════════════════
//  Thumbnail Builder
// ═══════════════════════════════════════════════════
async function makeThumbnail(moviePosterUrl, hardThumbUrl) {
  const primaryUrl = moviePosterUrl || hardThumbUrl;
  const fallbackUrl = hardThumbUrl;

  async function fetchThumb(url) {
    const img = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": "https://sinhalacartoons.com/",
      },
    });
    return await sharp(img.data).resize(300).jpeg({ quality: 65 }).toBuffer();
  }

  try {
    return await fetchThumb(primaryUrl);
  } catch (e) {
    console.log("⚠️ thumbnail primary fetch failed:", primaryUrl, "-", e.message);
    if (primaryUrl !== fallbackUrl) {
      try { return await fetchThumb(fallbackUrl); } catch (e2) {
        console.log("⚠️ thumbnail fallback fetch failed:", fallbackUrl, "-", e2.message);
      }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════
//  waitForReply - multi-use loop
// ═══════════════════════════════════════════════════
function waitForReply(conn, from, sender, replyToId, timeout = 600000) {
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
//  Helpers
// ═══════════════════════════════════════════════════
function cleanTitle(title) {
  if (!title) return "Unknown";
  return title.replace(/^HD\s*[\d.]*\s*/i, "").split("|")[0].trim();
}

function episodeLabel(ep) {
  // ep = { episode, title, stream_url }
  const num = parseInt(ep.episode, 10);
  return !isNaN(num) ? `Episode ${num}` : (ep.title || "Episode");
}

// ═══════════════════════════════════════════════════
//  Send the actual video file (direct CDN url - no ad-gate)
// ═══════════════════════════════════════════════════
async function sendDirectFile(conn, from, directUrl, fileName, caption, quotedMsg, posterUrl, sessionId, precomputedThumb) {
  const thumb = precomputedThumb !== undefined
    ? precomputedThumb
    : await makeThumbnail(posterUrl || null, getHardThumbUrl(sessionId));
  await react(conn, from, quotedMsg.key, "📥");

  try {
    const docMsg = await conn.sendMessage(from, {
      document: { url: directUrl },
      fileName: fileName.replace(/[\/\\:*?"<>|]/g, ""),
      mimetype: "video/mp4",
      jpegThumbnail: thumb || undefined,
      caption,
    }, { quoted: quotedMsg });

    await react(conn, from, docMsg.key, "✅");
  } catch (e) {
    console.log("❌ sendDirectFile error:", e.message);
    await conn.sendMessage(from, {
      text: `❌ File send කිරීමේදී දෝෂයක් සිදු විය.\n\n📎 Direct link:\n${directUrl}\n\n${caption}`
    }, { quoted: quotedMsg });
  }
}

// ═══════════════════════════════════════════════════
//  Shared flow: given a selected search result {title, url, thumbnail, ...},
//  hit the DL endpoint and either send the single file, or show an
//  episode picker for series with multiple episodes.
// ═══════════════════════════════════════════════════
async function runDlFlow(conn, from, sender, selMsg, selected, sessionId, FOOTER) {
  await react(conn, from, selMsg.msg.key, "⏳");

  let dlData;
  try {
    const dlRes = await axios.get(DL_URL(selected.url), { timeout: 20000 });
    // FIX: new API uses `success` (boolean), not `status === "success"`
    if (!dlRes.data?.success) throw new Error(dlRes.data?.message || "download lookup failed");
    dlData = dlRes.data?.results;
  } catch (e) {
    return conn.sendMessage(from, { text: `${BRAND}\n\n❌ Download API error: ${e.message}` }, { quoted: selMsg.msg });
  }

  // FIX: episodes live at results.episodes (array), not results.download_links
  const episodes = dlData?.episodes || [];
  if (!episodes.length) {
    return conn.sendMessage(from, { text: `${BRAND}\n\n❌ *${cleanTitle(selected.title)}*\n\nDownload links හමු නොවීය.` }, { quoted: selMsg.msg });
  }

  const poster = selected.thumbnail || getHardThumbUrl(sessionId);

  // Single episode → this is effectively a movie, send it straight away
  if (episodes.length === 1) {
    const ep = episodes[0];
    const fileName = `${cleanTitle(selected.title)}.mp4`;
    const caption = `${BRAND}\n\n✅ *Download Complete*\n\n🎬 *${cleanTitle(selected.title)}*\n⭐ *Rating:* ${selected.rating || "?"}\n💿 *Quality:* ${selected.quality || "?"}`;
    return sendDirectFile(conn, from, ep.stream_url, fileName, caption, selMsg.msg, poster, sessionId);
  }

  // Multiple episodes → show a picker
  await react(conn, from, selMsg.msg.key, "📺");

  let epText = `${BRAND}\n\n📺 *${cleanTitle(selected.title)}*\n📁 *Total Episodes:* ${dlData.total_episodes || episodes.length}\n\n*0.* 📦 All Episodes (download one by one)\n*Episodes:*\n`;
  episodes.forEach((ep, i) => { epText += `*${i + 1}.* ${episodeLabel(ep)}\n`; });
  epText += `\n📌 Episode අංකයෙන් Reply කරන්න (සියල්ලම ඕන නම් *0* Reply කරන්න).\n\n${FOOTER}`;

  const epMsg = await conn.sendMessage(from, { text: epText }, { quoted: selMsg.msg });

  const startEpFlow = async () => {
    while (true) {
      const epSel = await waitForReply(conn, from, sender, epMsg.key.id);
      if (!epSel) break;

      (async () => {
        // 0 = download ALL episodes, one after another
        if (epSel.text.trim() === "0") {
          await react(conn, from, epSel.msg.key, "📦");
          await conn.sendMessage(from, {
            text: `${BRAND}\n\n📦 *${cleanTitle(selected.title)}*\n\nEpisodes ${episodes.length}ම එකින් එක download කරමින්... ⏳\n\n${FOOTER}`
          }, { quoted: epSel.msg });

          // Fetch the poster thumbnail ONCE and reuse for every episode.
          const sharedThumb = await makeThumbnail(poster, getHardThumbUrl(sessionId));

          for (let i = 0; i < episodes.length; i++) {
            const ep = episodes[i];
            const epName = episodeLabel(ep);
            const fileName = `${cleanTitle(selected.title)} - ${epName}.mp4`;
            const caption = `${BRAND}\n\n✅ *Download Complete* (${i + 1}/${episodes.length})\n\n🎬 *${cleanTitle(selected.title)}*\n📺 *${epName}*`;
            await sendDirectFile(conn, from, ep.stream_url, fileName, caption, epSel.msg, null, sessionId, sharedThumb);
          }
          return;
        }

        const epIndex = parseInt(epSel.text) - 1;
        const ep = episodes[epIndex];
        if (isNaN(epIndex) || !ep) {
          return conn.sendMessage(from, { text: `${BRAND}\n\n❌ වලංගු episode අංකයක් ඇතුලත් කරන්න (0 = සියල්ලම).` }, { quoted: epSel.msg });
        }

        const epName = episodeLabel(ep);
        const fileName = `${cleanTitle(selected.title)} - ${epName}.mp4`;
        const caption = `${BRAND}\n\n✅ *Download Complete*\n\n🎬 *${cleanTitle(selected.title)}*\n📺 *${epName}*`;
        await sendDirectFile(conn, from, ep.stream_url, fileName, caption, epSel.msg, poster, sessionId);
      })();
    }
  };
  startEpFlow();
}

// ═══════════════════════════════════════════════════
//  SINHALA CARTOON COMMAND (search)
// ═══════════════════════════════════════════════════
cmd({
  pattern: "sinhalacartoon",
  alias: ["cartoon", "scartoon"],
  desc: "SinhalaCartoons.com Search / Download",
  category: "downloader",
  react: "🔍",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, sender, sessionId }) => {
  try {
    const FOOTER = BRAND;

    if (!q || !q.trim()) {
      return reply(`${BRAND}\n\nᴜsᴀɢᴇ: *.cartoon ben 10*\n\nSearch කරන්න cartoon නමක් type කරන්න 🔮`);
    }

    await react(conn, from, m.key, "🔍");

    let items;
    try {
      const searchRes = await axios.get(SEARCH_URL(q), { timeout: 20000 });
      // FIX: new API uses `success` (boolean), and results is a flat array
      // directly at data.results — NOT data.results.results
      if (!searchRes.data?.success) throw new Error(searchRes.data?.message || "search failed");
      items = searchRes.data?.results;
    } catch (e) {
      return reply(`${BRAND}\n\n❌ Search API error: ${e.message}`);
    }

    if (!Array.isArray(items) || !items.length) {
      return reply(`${BRAND}\n\n❌ ප්‍රතිඵල හමු නොවීය. වෙනත් නමකින් සොයන්න.`);
    }

    let listText = `${BRAND}\n\nsᴇᴀʀᴄʜ ʀᴇsᴜʟᴛs ꜰᴏʀ: *${q}*\n\n`;
    items.slice(0, 15).forEach((v, i) => {
      listText += `*${i + 1}.* ${cleanTitle(v.title)}\n   ⭐ ${v.rating || "?"}  |  🎬 ${v.quality || "HD"}  |  📁 ${v.type || "Cartoon"}\n\n`;
    });
    listText += `📌 අංකයෙන් Reply කරන්න.\n\n${FOOTER}`;

    const listMsg = await conn.sendMessage(from, { text: listText }, { quoted: mek });

    // ── Select loop ──
    const startSelectFlow = async () => {
      while (true) {
        const sel = await waitForReply(conn, from, sender, listMsg.key.id);
        if (!sel) break;

        (async () => {
          const index = parseInt(sel.text) - 1;
          const selected = items[index];
          if (isNaN(index) || !selected) {
            return conn.sendMessage(from, { text: `${BRAND}\n\n❌ වලංගු අංකයක් ඇතුලත් කරන්න.` }, { quoted: sel.msg });
          }

          await runDlFlow(conn, from, sender, sel, selected, sessionId, FOOTER);
        })();
      }
    };

    startSelectFlow();

  } catch (e) {
    console.error("📛 SINHALACARTOON ERROR:", e);
    reply(`${BRAND}\n\n⚠️ Error: ${e.message}`);
  }
});
