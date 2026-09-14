const { cmd } = require('../command');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════
//  HENTAI PLUGIN — SHAVIYA-XMD
//  Search · Menu Selection · Download
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const API_KEY = 'zan_vWpU1lkr_g6wwxdlvyv';
const API_BASE = 'https://api.zanta-mini.store/api/hentai';
const FOOTER = '👑 SHAVIYA-XMD 👑';
const CREDIT = '> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮';

// Per-user context store
if (!global.hentaiContexts) global.hentaiContexts = {};

// ─────────────────────────────────────────────
//  API GET
// ─────────────────────────────────────────────
async function apiGet(endpoint, url) {
    const res = await axios.get(`${API_BASE}/${endpoint}`, {
        params: { apiKey: API_KEY, url },
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return res.data;
}

// ─────────────────────────────────────────────
//  Title helpers
// ─────────────────────────────────────────────
function titleFromUrl(url) {
    try {
        const parts = String(url).split('/').filter(Boolean);
        const slug = parts[parts.length - 1] || 'Video';
        return decodeURIComponent(slug)
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .substring(0, 60);
    } catch (e) {
        return 'Video';
    }
}

function shortTitle(t, max) {
    max = max || 45;
    if (!t) return 'Unknown';
    return t.length > max ? t.substring(0, max) + '…' : t;
}

// ══════════════════════════════════════════════════════════════
//  ✅ ROBUST REPLY WAITER — supports list/button/number replies
// ══════════════════════════════════════════════════════════════
function waitForReply(conn, from, sender, targetId, timeoutMs = 180000) {
    return new Promise((resolve) => {
        let resolved = false;
        const done = (payload) => {
            if (resolved) return;
            resolved = true;
            try { conn.ev.off('messages.upsert', handler); } catch (e) {}
            resolve(payload);
        };
        const handler = (update) => {
            if (resolved) return;
            const msg = update.messages?.[0];
            if (!msg?.message) return;
            if (msg.key.remoteJid !== from) return;
            if (msg.key.fromMe) return;

            // Ignore other users
            const msgSender = msg.key.participant || msg.key.remoteJid;
            if (!msgSender.includes(sender.split('@')[0]) && !msgSender.includes("@lid")) return;

            const keys = Object.keys(msg.message);

            // ── List reply (menu selection) ──
            if (keys.includes('listResponseMessage')) {
                const lr = msg.message.listResponseMessage;
                const id = lr?.singleSelectReply?.selectedRowId
                        || lr?.singleSelectReply?.selectedRowID;
                if (id) return done({ msg, text: String(id).trim() });
            }

            // ── Native flow / interactive ──
            if (keys.includes('interactiveResponseMessage')) {
                try {
                    const inter = msg.message.interactiveResponseMessage;
                    const native = inter?.nativeFlowResponseMessage;
                    if (native) {
                        const parsed = JSON.parse(native.paramsJson || "{}");
                        const id = parsed.id || native.name || "";
                        if (id) return done({ msg, text: String(id).trim() });
                    }
                    const body = inter?.body?.text;
                    if (body) return done({ msg, text: String(body).trim() });
                } catch (e) {}
            }

            // ── Buttons ──
            if (keys.includes('buttonsResponseMessage')) {
                const id = msg.message.buttonsResponseMessage?.selectedButtonId;
                if (id) return done({ msg, text: String(id).trim() });
            }
            if (keys.includes('templateButtonReplyMessage')) {
                const id = msg.message.templateButtonReplyMessage?.selectedId;
                if (id) return done({ msg, text: String(id).trim() });
            }

            // ── Number reply (quoted) ──
            if (keys.includes('extendedTextMessage')) {
                const ext = msg.message.extendedTextMessage;
                const ctx = ext?.contextInfo;
                if (ctx?.stanzaId === targetId) {
                    const txt = ext?.text || "";
                    if (txt) return done({ msg, text: txt.trim() });
                }
            }

            // ── Plain conversation reply (fallback) ──
            if (keys.includes('conversation')) {
                const txt = msg.message.conversation;
                const ctx = msg.message?.extendedTextMessage?.contextInfo;
                // Accept only if quoted OR targetId match
                if (txt) {
                    if (!targetId || (ctx && ctx.stanzaId === targetId)) {
                        return done({ msg, text: txt.trim() });
                    }
                }
            }
        };
        conn.ev.on('messages.upsert', handler);
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                try { conn.ev.off('messages.upsert', handler); } catch (e) {}
            }
        }, timeoutMs);
    });
}

// ─────────────────────────────────────────────
//  Download + Send
// ─────────────────────────────────────────────
async function downloadAndSend(conn, mek, sender, link, title, quality) {
    try {
        await conn.sendMessage(sender, { react: { text: '📥', key: mek.key } });

        const streamRes = await axios({
            url: link,
            method: 'GET',
            responseType: 'stream',
            timeout: 180000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://xanimeporn.com/'
            }
        });

        await conn.sendMessage(sender, { react: { text: '📤', key: mek.key } });

        await conn.sendMessage(sender, {
            video: { stream: streamRes.data },
            mimetype: 'video/mp4',
            fileName: `${title.substring(0, 40)} [${quality}].mp4`,
            caption: `🎬 *${title}*\n💎 *Quality:* ${quality}\n\n${CREDIT}`
        }, { quoted: mek });

        await conn.sendMessage(sender, { react: { text: '✅', key: mek.key } });
    } catch (err) {
        console.error('[HENTAI DL]', err.message);
        await conn.sendMessage(sender, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(sender, {
            text: `❌ *Download Error:* ${err.message}`
        }, { quoted: mek });
    }
}

// ══════════════════════════════════════════════════════════════
//  .hentai <query> — SEARCH (Menu Selection)
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'hentai',
    alias: ['hsearch', 'hanime2', 'hentaisearch'],
    desc: 'Search hentai anime (Menu Selection)',
    category: 'anime',
    react: '🔍',
    filename: __filename
},
async (conn, mek, m, { from, args, sender, reply, sessionId }) => {
    try {
        const q = (args.join(' ') || '').trim();
        if (!q) return reply('❌ *Usage:* `.hentai <name>`\n💡 උදා: `.hentai new`');

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        const data = await apiGet('search', q);

        if (!data || !data.success || !Array.isArray(data.results) || !data.results.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`🚫 *No results found for:* _${q}_`);
        }

        const top = data.results.slice(0, 10);

        // ─── Build menu rows ───
        const rows = top.map((item, i) => ({
            title: `${i + 1}. ${shortTitle(item.title, 55)}`,
            description: `🎬 Tap to select`,
            rowId: String(i + 1)
        }));

        const firstThumb = top.find(x => x.thumbnail && /^https?:\/\//.test(x.thumbnail))?.thumbnail;

        // ─── Send as menu (list) ───
        let sentMsg;
        const menuText =
            `🔍 *Search Results*\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +
            `📝 *Query:* _${q}_\n` +
            `📊 *Found:* ${data.total_results || top.length} results\n\n` +
            `👇 *Tap below to select*\n\n` +
            `_Or reply with number (1-${top.length})_\n\n` +
            `${CREDIT}`;

        const menuPayload = {
            text: menuText,
            footer: FOOTER,
            title: '🔍 Hentai Search',
            buttonText: '📋 𝐒𝐄𝐋𝐄𝐂𝐓 𝐑𝐄𝐒𝐔𝐋𝐓',
            sections: [{
                title: '🎬 Search Results',
                rows: rows
            }]
        };

        if (firstThumb) {
            try {
                sentMsg = await conn.sendMessage(from, {
                    image: { url: firstThumb },
                    caption: menuText,
                    footer: FOOTER,
                    title: '🔍 Hentai Search',
                    buttonText: '📋 𝐒𝐄𝐋𝐄𝐂𝐓 𝐑𝐄𝐒𝐔𝐋𝐓',
                    sections: [{
                        title: '🎬 Search Results',
                        rows: rows
                    }]
                }, { quoted: mek });
            } catch (e) {
                // fallback without image
                sentMsg = await conn.sendMessage(from, menuPayload, { quoted: mek });
            }
        } else {
            sentMsg = await conn.sendMessage(from, menuPayload, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        // ─── Wait for user selection ───
        const selection = await waitForReply(conn, from, sender, sentMsg.key.id, 180000);
        if (!selection) return;

        const choice = String(selection.text).replace(/[^\d]/g, '');
        const num = parseInt(choice, 10);
        if (isNaN(num) || num < 1 || num > top.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: selection.msg.key } });
            return reply('❌ Invalid selection.');
        }

        const selected = top[num - 1];
        await conn.sendMessage(from, { react: { text: '⏳', key: selection.msg.key } });

        // ─── Fetch download links ───
        const dlData = await apiGet('dl', selected.url);
        const links = dlData?.result?.download_links;

        if (!Array.isArray(links) || !links.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: selection.msg.key } });
            return conn.sendMessage(from, {
                text: '🚫 *Download links හමුවුණේ නෑ!*'
            }, { quoted: selection.msg });
        }

        // ─── Build quality menu ───
        const qRows = links.map((link, i) => ({
            title: `${i + 1}. ${link.quality}`,
            description: `📥 Download in ${link.quality}`,
            rowId: String(i + 1)
        }));

        const qText =
            `📺 *${shortTitle(selected.title, 60)}*\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +
            `💎 *Available Qualities:*\n\n` +
            `👇 *Tap to download*\n\n` +
            `_Or reply with number (1-${links.length})_\n\n` +
            `${CREDIT}`;

        let qMsg;
        const thumb = selected.thumbnail;

        if (thumb) {
            try {
                qMsg = await conn.sendMessage(from, {
                    image: { url: thumb },
                    caption: qText,
                    footer: FOOTER,
                    title: '💎 Select Quality',
                    buttonText: '📥 𝐒𝐄𝐋𝐄𝐂𝐓 𝐐𝐔𝐀𝐋𝐈𝐓𝐘',
                    sections: [{
                        title: '🎬 Available Qualities',
                        rows: qRows
                    }]
                }, { quoted: selection.msg });
            } catch (e) {
                qMsg = await conn.sendMessage(from, {
                    text: qText,
                    footer: FOOTER,
                    title: '💎 Select Quality',
                    buttonText: '📥 𝐒𝐄𝐋𝐄𝐂𝐓 𝐐𝐔𝐀𝐋𝐈𝐓𝐘',
                    sections: [{
                        title: '🎬 Available Qualities',
                        rows: qRows
                    }]
                }, { quoted: selection.msg });
            }
        } else {
            qMsg = await conn.sendMessage(from, {
                text: qText,
                footer: FOOTER,
                title: '💎 Select Quality',
                buttonText: '📥 𝐒𝐄𝐋𝐄𝐂𝐓 𝐐𝐔𝐀𝐋𝐈𝐓𝐘',
                sections: [{
                    title: '🎬 Available Qualities',
                    rows: qRows
                }]
            }, { quoted: selection.msg });
        }

        // ─── Wait for quality selection ───
        const qSel = await waitForReply(conn, from, sender, qMsg.key.id, 180000);
        if (!qSel) return;

        const qChoice = String(qSel.text).replace(/[^\d]/g, '');
        const qNum = parseInt(qChoice, 10);
        if (isNaN(qNum) || qNum < 1 || qNum > links.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: qSel.msg.key } });
            return reply('❌ Invalid quality.');
        }

        const chosen = links[qNum - 1];

        await downloadAndSend(conn, qSel.msg, from, chosen.direct_link, selected.title, chosen.quality);

    } catch (err) {
        console.error('[HENTAI SEARCH]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Search Error:* ${err.message}`);
    }
});

// ══════════════════════════════════════════════════════════════
//  .hquick <query> — Quick download (best quality)
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'hquick',
    alias: ['hfast', 'hauto'],
    desc: 'Quick download — best quality',
    category: 'anime',
    react: '⚡',
    filename: __filename
},
async (conn, mek, m, { from, args, sender, reply }) => {
    try {
        const q = (args.join(' ') || '').trim();
        if (!q) return reply('❌ *Usage:* `.hquick <name>`');

        await conn.sendMessage(from, { react: { text: '⚡', key: mek.key } });

        const searchData = await apiGet('search', q);
        if (!searchData?.results?.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('🚫 No results found.');
        }

        const first = searchData.results[0];
        await conn.sendMessage(from, {
            text: `⚡ *Quick Download*\n\n🎬 ${shortTitle(first.title)}\n\n⏳ Fetching links...`
        }, { quoted: mek });

        const dlData = await apiGet('dl', first.url);
        const links = dlData?.result?.download_links;

        if (!Array.isArray(links) || !links.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('🚫 No download links.');
        }

        const best = links.find(l => l.quality === '1080p')
                  || links.find(l => l.quality === '720p')
                  || links[0];

        await downloadAndSend(conn, mek, from, best.direct_link, first.title, best.quality);
    } catch (err) {
        console.error('[HQUICK]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Error:* ${err.message}`);
    }
});
