// ============================================================
//  plugins/ytsearch.js — SHAVIYA-XMD
//  YouTube Search → Menu Selection (List Style)
//  Created by: Savendra Dampriya
// ============================================================

'use strict';

const axios = require('axios');
const { cmd } = require('../command');

const MAX_RESULTS = Number(process.env.YTC_MAX_RESULTS || 10);
const DEBUG = true;

const HDR_TITLE   = "🎬 SHAVIYA-XMD YOUTUBE";
const HDR_FOOTER  = "⚡ Powered by SHAVIYA-XMD";

// Store search results per user
if (!global.ytSearchStore) global.ytSearchStore = {};

// ─────────────── Helpers ───────────────
async function react(conn, from, key, emoji) {
    try { await conn.sendMessage(from, { react: { text: emoji, key } }); } catch {}
}

function truncate(v, max) {
    const t = String(v || "").replace(/\s+/g, " ").trim();
    return t.length <= max ? t : t.slice(0, max - 1) + "…";
}

function fmtDur(sec) {
    sec = Number(sec) || 0;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

// ─────────────── YouTube Search ───────────────
async function searchYouTube(q) {
    const sources = [
        {
            name: 'Piped-Kavin',
            url: `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`,
            parse: (d) => (d?.items || []).map(v => ({
                title: v.title,
                url: `https://youtube.com/watch?v=${(v.url || '').split('=')[1]}`,
                videoId: (v.url || '').split('=')[1],
                thumbnail: v.thumbnail,
                duration_seconds: v.duration ? fmtDur(v.duration) : 'N/A',
                channelTitle: v.uploaderName || 'Unknown'
            }))
        },
        {
            name: 'Piped-Adminforge',
            url: `https://pipedapi.adminforge.de/search?q=${encodeURIComponent(q)}&filter=videos`,
            parse: (d) => (d?.items || []).map(v => ({
                title: v.title,
                url: `https://youtube.com/watch?v=${(v.url || '').split('=')[1]}`,
                videoId: (v.url || '').split('=')[1],
                thumbnail: v.thumbnail,
                duration_seconds: v.duration ? fmtDur(v.duration) : 'N/A',
                channelTitle: v.uploaderName || 'Unknown'
            }))
        },
        {
            name: 'yt-search',
            custom: async () => {
                const yts = require('yt-search');
                const r = await yts(q);
                return (r.videos || []).slice(0, MAX_RESULTS).map(v => ({
                    title: v.title,
                    url: v.url,
                    videoId: v.videoId,
                    thumbnail: v.thumbnail,
                    duration_seconds: v.timestamp || 'N/A',
                    channelTitle: v.author?.name || 'Unknown'
                }));
            }
        }
    ];

    let lastErr = null;
    for (const src of sources) {
        try {
            if (DEBUG) console.log(`[YT] Trying: ${src.name}`);

            let results;
            if (src.custom) results = await src.custom();
            else {
                const res = await axios.get(src.url, { timeout: 15000 });
                results = src.parse(res.data);
            }

            if (results && results.length > 0) {
                if (DEBUG) console.log(`[YT] ✅ ${src.name}: ${results.length}`);
                return results.slice(0, MAX_RESULTS);
            }
        } catch (e) {
            lastErr = e;
            if (DEBUG) console.log(`[YT] ❌ ${src.name}: ${e.message}`);
        }
    }
    throw new Error(lastErr?.message || "All sources failed");
}

// ─────────────── Wait for reply (number or list) ───────────────
function waitForSelection(conn, from, sender, targetId, timeoutMs = 300000) {
    return new Promise((resolve) => {
        let resolved = false;
        const done = (payload) => {
            if (resolved) return;
            resolved = true;
            conn.ev.off("messages.upsert", handler);
            resolve(payload);
        };
        const handler = (update) => {
            if (resolved) return;
            const msg = update.messages?.[0];
            if (!msg?.message) return;
            if (msg.key.remoteJid !== from) return;

            const msgKeys = Object.keys(msg.message);

            // List reply
            if (msgKeys.includes('listResponseMessage')) {
                const listReply = msg.message.listResponseMessage;
                const selectedId = listReply?.singleSelectReply?.selectedRowId;
                if (selectedId) return done({ msg, text: String(selectedId).trim() });
            }

            // Native flow / buttons
            if (msgKeys.includes('interactiveResponseMessage')) {
                try {
                    const inter = msg.message.interactiveResponseMessage;
                    const nativeReply = inter?.nativeFlowResponseMessage;
                    if (nativeReply) {
                        const parsed = JSON.parse(nativeReply.paramsJson || "{}");
                        const id = parsed.id || nativeReply.name || "";
                        if (id) return done({ msg, text: String(id).trim() });
                    }
                } catch (e) {}
            }

            if (msgKeys.includes('buttonsResponseMessage')) {
                const btnId = msg.message.buttonsResponseMessage?.selectedButtonId;
                if (btnId) return done({ msg, text: String(btnId).trim() });
            }

            // Number reply (quoted)
            if (msgKeys.includes('extendedTextMessage')) {
                const ext = msg.message.extendedTextMessage;
                const ctx = ext?.contextInfo;
                if (ctx?.stanzaId === targetId) {
                    const text = ext?.text || "";
                    if (text) return done({ msg, text: text.trim() });
                }
            }
            if (msgKeys.includes('conversation')) {
                const text = msg.message.conversation;
                if (text) return done({ msg, text: text.trim() });
            }
        };
        conn.ev.on("messages.upsert", handler);
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                conn.ev.off("messages.upsert", handler);
            }
        }, timeoutMs);
    });
}

// ══════════════════════════════════════════════════════════════
//  .yts2 — Search with Menu Selection
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'yts2',
    alias: ['ytsearch2', 'ytmenu'],
    react: '🔍',
    category: 'search',
    desc: 'YouTube search with menu selection',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender, sessionId }) => {
    const query = (q || '').trim();
    if (!query) {
        await react(conn, from, mek.key, '❌');
        return reply('❌ *Usage:* `.yts2 <search>`');
    }

    await react(conn, from, mek.key, '🔍');

    try {
        const videos = await searchYouTube(query);
        if (!videos.length) {
            await react(conn, from, mek.key, '❌');
            return reply('❌ No results found.');
        }

        // Save results per user
        global.ytSearchStore[sender] = {
            results: videos,
            time: Date.now(),
            query: query
        };

        // Build list menu
        const rows = videos.map((v, i) => ({
            title: `${i + 1}. ${truncate(v.title, 60)}`,
            description: `⏱️ ${v.duration_seconds} • 📺 ${truncate(v.channelTitle, 30)}`,
            rowId: String(i + 1)
        }));

        const menuText =
            `🎬 *𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃 𝐘𝐎𝐔𝐓𝐔𝐁𝐄*\n\n` +
            `🔍 *Search:* "${query}"\n` +
            `📊 *Results:* ${videos.length}\n\n` +
            `👇 *Select a video to download*\n\n` +
            `_Or reply with number (1-${videos.length})_`;

        const sentMsg = await conn.sendMessage(from, {
            text: menuText,
            footer: "⚡ SHAVIYA-XMD",
            title: "🎬 YouTube Search",
            buttonText: "📥 𝐒𝐄𝐋𝐄𝐂𝐓 𝐕𝐈𝐃𝐄𝐎 📥",
            sections: [{
                title: "🎬 Search Results",
                rows: rows
            }]
        }, { quoted: mek });

        await react(conn, from, mek.key, '✅');

        // Wait for user selection
        const selection = await waitForSelection(conn, from, sender, sentMsg.key.id);
        if (!selection) return;

        const choice = String(selection.text).replace(/[^\d]/g, '');
        const num = parseInt(choice, 10);
        if (isNaN(num) || num < 1 || num > videos.length) {
            return reply('❌ Invalid selection.');
        }

        const selected = videos[num - 1];

        await conn.sendMessage(from, { react: { text: '📥', key: selection.msg.key } });

        // Send download info + trigger .yt command manually
        await conn.sendMessage(from, {
            text:
                `📹 *Selected Video*\n\n` +
                `🎬 ${selected.title}\n` +
                `⏱️ ${selected.duration_seconds}\n` +
                `📺 ${selected.channelTitle}\n\n` +
                `_Downloading..._`
        }, { quoted: selection.msg });

        // Trigger download via .yt (re-send the command internally)
        const ytCommand = `yt ${selected.url}`;
        const cmdModules = require('../command').commands;
        const ytCmd = cmdModules.find(c => c.pattern === 'yt' || (c.alias && c.alias.includes('yt')));

        if (ytCmd && typeof ytCmd.function === 'function') {
            try {
                await ytCmd.function(conn, selection.msg, {
                    quoted: selection.msg
                }, {
                    from,
                    body: `.${ytCommand}`,
                    isCmd: true,
                    command: 'yt',
                    args: [selected.url],
                    q: selected.url,
                    sender,
                    reply: (t) => conn.sendMessage(from, { text: t }, { quoted: selection.msg }),
                    sessionId
                });
            } catch (e) {
                console.error('[YT] Trigger error:', e.message);
                await conn.sendMessage(from, {
                    text: `❌ Download failed: ${e.message}`
                }, { quoted: selection.msg });
            }
        } else {
            await conn.sendMessage(from, {
                text: `📥 *Download with:*\n\`.yt ${selected.url}\``
            }, { quoted: selection.msg });
        }

    } catch (err) {
        console.error('[YT] Error:', err.message);
        await react(conn, from, mek.key, '❌');
        reply(`❌ Search failed: ${err.message}`);
    }
});
