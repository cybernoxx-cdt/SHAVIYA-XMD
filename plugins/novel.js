const { cmd } = require('../command');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════
//  SINHALA NOVEL DOWNLOADER — SHAVIYA-XMD
//  Search + Direct PDF Download (Number-based, No Buttons)
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const API_KEY = 'zan_vWpU1lkr_g6wwxdlvyv';
const API_BASE = 'https://api.zanta-mini.store/api/novel';
const FOOTER = '👑 SHAVIYA-XMD 👑';
const CREDIT = '> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮';
const BYPASS_TAG = 'ʙʏᴘᴀꜱꜱᴇᴅ ʙʏ ꜱᴀᴠᴇɴᴅʀᴀ ᴅᴀᴍᴘʀɪʏᴀ';

// Per-user context store
if (!global.novelContexts) global.novelContexts = {};

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
//  Clean title for filename
// ─────────────────────────────────────────────
function cleanTitle(t) {
    return String(t || 'Novel')
        .replace(/[^\w\s\u0D80-\u0DFF-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 50);
}

// ─────────────────────────────────────────────
//  Short title
// ─────────────────────────────────────────────
function shortTitle(t, max) {
    max = max || 50;
    if (!t) return 'Unknown';
    return t.length > max ? t.substring(0, max) + '…' : t;
}

// ─────────────────────────────────────────────
//  Download + Send PDF
// ─────────────────────────────────────────────
async function downloadAndSend(conn, replyMsg, from, novelUrl) {
    try {
        const data = await apiGet('dl', novelUrl);

        if (!data || !data.success || !Array.isArray(data.download_links) || !data.download_links.length) {
            throw new Error('Download links හමුවුණේ නෑ!');
        }

        const title = data.title || 'Novel';

        // Find DOWNLOAD link (not READ ONLINE)
        const downloadLink = data.download_links.find(l => l.label === 'DOWNLOAD')
                          || data.download_links.find(l => /pdf/i.test(l.url))
                          || data.download_links[data.download_links.length - 1];

        if (!downloadLink) {
            throw new Error('Download link හමුවුණේ නෑ!');
        }

        await conn.sendMessage(from, { react: { text: '📥', key: replyMsg.key } });

        // Download PDF with redirects
        const streamRes = await axios({
            url: downloadLink.url,
            method: 'GET',
            responseType: 'stream',
            timeout: 180000,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://sinhalaebooks.com/'
            }
        });

        await conn.sendMessage(from, { react: { text: '📤', key: replyMsg.key } });

        const safeTitle = cleanTitle(title);

        // Send PDF directly
        await conn.sendMessage(from, {
            document: { stream: streamRes.data },
            mimetype: 'application/pdf',
            fileName: `${safeTitle} (${BYPASS_TAG}).pdf`,
            caption: `📚 *${title}*\n\n_${BYPASS_TAG}_\n\n${CREDIT}`
        }, { quoted: replyMsg });

        await conn.sendMessage(from, { react: { text: '✅', key: replyMsg.key } });

    } catch (err) {
        console.error('[NOVEL DL]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: replyMsg.key } });
        await conn.sendMessage(from, {
            text: `❌ *Download Error:* ${err.message}`
        }, { quoted: replyMsg });
    }
}

// ══════════════════════════════════════════════════════════════
//  .novel <query> — SEARCH (Number-based)
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'novel',
    alias: ['book', 'ebook', 'sinhalanovel'],
    desc: 'Search and download Sinhala novels (Number-based)',
    category: 'download',
    react: '📚',
    filename: __filename
},
async (conn, mek, m, { from, args, sender, reply }) => {
    try {
        const q = (args.join(' ') || '').trim();
        if (!q) {
            return reply('❌ *Usage:* `.novel <name>`\n💡 උදා: `.novel new` හෝ `.novel shrungariye`');
        }

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        const data = await apiGet('search', q);

        if (!data || !data.success || !Array.isArray(data.results) || !data.results.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`🚫 *No results found for:* _${q}_`);
        }

        // If only 1 result → auto download
        if (data.results.length === 1) {
            const item = data.results[0];
            await conn.sendMessage(from, {
                text: `📚 *${shortTitle(item.title, 60)}*\n\n⏳ Downloading PDF...`
            }, { quoted: mek });

            await downloadAndSend(conn, mek, from, item.url);
            return;
        }

        const top = data.results.slice(0, 10);

        // Build numbered list
        let menuText = `📚 *Search Results for:* _${q}_\n\n`;
        menuText += `📊 *Found:* ${data.count || data.results.length} results\n\n`;

        for (let i = 0; i < top.length; i++) {
            menuText += `*[ ${i + 1} ]* ${shortTitle(top[i].title)}\n`;
        }

        menuText += `\n💡 *Reply with number (1-${top.length}) to download*\n`;
        menuText += `> ⏳ _Menu active for 3 minutes_\n\n${CREDIT}`;

        const firstThumb = top.find(x => x.thumbnail && /^https?:\/\//.test(x.thumbnail))?.thumbnail;

        const sentMsg = await conn.sendMessage(from, {
            image: firstThumb ? { url: firstThumb } : undefined,
            text: firstThumb ? undefined : menuText,
            caption: firstThumb ? menuText : undefined
        }, { quoted: mek });

        // Remove old listener
        if (global.novelContexts[sender] && global.novelContexts[sender].listener) {
            try { conn.ev.off('messages.upsert', global.novelContexts[sender].listener); } catch (e) {}
        }

        // Reply listener
        const listener = async ({ messages }) => {
            try {
                const rcv = messages[0];
                if (!rcv || !rcv.message) return;
                if (rcv.key.remoteJid !== from) return;
                if (rcv.key.fromMe) return;

                const getMsg = (mm) => {
                    if (!mm) return null;
                    if (mm.ephemeralMessage) return mm.ephemeralMessage.message;
                    if (mm.viewOnceMessage) return mm.viewOnceMessage.message;
                    return mm;
                };

                const actual = getMsg(rcv.message);
                const ext = actual?.extendedTextMessage;
                const ctx = ext?.contextInfo;
                if (!ctx || !ctx.stanzaId) return;

                const store = global.novelContexts[sender];
                if (!store) return;
                if (ctx.stanzaId !== store.quotedId) return;

                const txt = (ext.text || '').trim();
                const num = parseInt(txt, 10);
                if (isNaN(num) || num < 1 || num > store.results.length) return;

                const selected = store.results[num - 1];
                if (!selected) return;

                // Remove listener
                try { conn.ev.off('messages.upsert', listener); } catch (e) {}
                delete global.novelContexts[sender];

                // Download + send PDF
                await downloadAndSend(conn, rcv, from, selected.url);

            } catch (err) {
                console.error('[NOVEL LISTENER]', err.message);
            }
        };

        global.novelContexts[sender] = {
            quotedId: sentMsg.key.id,
            results: top,
            listener: listener
        };

        conn.ev.on('messages.upsert', listener);

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        // Auto cleanup
        setTimeout(() => {
            const s = global.novelContexts[sender];
            if (s && s.listener === listener) {
                try { conn.ev.off('messages.upsert', listener); } catch (e) {}
                delete global.novelContexts[sender];
            }
        }, 3 * 60 * 1000);

    } catch (err) {
        console.error('[NOVEL SEARCH]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Search Error:* ${err.message}`);
    }
});
