const { cmd } = require('../command');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════
//  SINHALA NOVEL DOWNLOADER — SHAVIYA-XMD
//  Search + Direct PDF Download (no links)
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const API_KEY = 'zan_vWpU1lkr_g6wwxdlvyv';
const API_BASE = 'https://api.zanta-mini.store/api/novel';
const FOOTER = '👑 SHAVIYA-XMD 👑';
const CREDIT = '> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮';
const BYPASS_TAG = 'ʙʏᴘᴀꜱꜱᴇᴅ ʙʏ ꜱᴀᴠᴇɴᴅʀᴀ ᴅᴀᴍᴘʀɪʏᴀ';

// ─────────────────────────────────────────────
//  Helper: API GET
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
//  Helper: clean title for filename
// ─────────────────────────────────────────────
function cleanTitle(t) {
    return String(t || 'Novel')
        .replace(/[^\w\s\u0D80-\u0DFF-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 50);
}

// ─────────────────────────────────────────────
//  Helper: download + send PDF
// ─────────────────────────────────────────────
async function downloadAndSend(conn, mek, from, novelUrl) {
    const data = await apiGet('dl', novelUrl);

    if (!data || !data.success || !Array.isArray(data.download_links) || !data.download_links.length) {
        throw new Error('Download links හමුවුණේ නෑ!');
    }

    const title = data.title || 'Novel';

    // Find the DOWNLOAD link (not READ ONLINE)
    const downloadLink = data.download_links.find(l => l.label === 'DOWNLOAD')
                      || data.download_links.find(l => /pdf/i.test(l.url))
                      || data.download_links[data.download_links.length - 1];

    if (!downloadLink) {
        throw new Error('Download link හමුවුණේ නෑ!');
    }

    await conn.sendMessage(from, { react: { text: '📥', key: mek.key } });

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

    await conn.sendMessage(from, { react: { text: '📤', key: mek.key } });

    const safeTitle = cleanTitle(title);

    // Direct PDF send — no links
    await conn.sendMessage(from, {
        document: { stream: streamRes.data },
        mimetype: 'application/pdf',
        fileName: `${safeTitle} (${BYPASS_TAG}).pdf`,
        caption: `📚 *${title}*\n\n_${BYPASS_TAG}_\n\n${CREDIT}`
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
}

// ══════════════════════════════════════════════════════════════
//  .novel <query> — SEARCH + DOWNLOAD
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'novel',
    alias: ['book', 'ebook', 'sinhalanovel'],
    desc: 'Search and download Sinhala novels (PDF)',
    category: 'download',
    react: '📚',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
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
                text: `📚 *${item.title}*\n\n⏳ Downloading PDF...`
            }, { quoted: mek });

            try {
                await downloadAndSend(conn, mek, from, item.url);
            } catch (err) {
                await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
                reply(`❌ *Download Error:* ${err.message}`);
            }
            return;
        }

        // Multiple results → show buttons
        const top = data.results.slice(0, 10);

        const buttons = top.map(item => {
            const short = item.title.length > 30 ? item.title.substring(0, 30) + '…' : item.title;
            const payload = Buffer.from(item.url).toString('base64url');
            return {
                buttonId: `.novelget ${payload}`,
                buttonText: { displayText: `📖 ${short}` },
                type: 1
            };
        });

        const firstThumb = top.find(x => x.thumbnail && /^https?:\/\//.test(x.thumbnail))?.thumbnail;

        const opts = {
            caption: `📚 *Search Results for:* _${q}_\n\n📊 *Found:* ${data.count || data.results.length} results\n\n💡 Tap a book to download PDF\n\n${CREDIT}`,
            footer: FOOTER,
            buttons: buttons,
            headerType: firstThumb ? 4 : 1
        };
        if (firstThumb) opts.image = { url: firstThumb };

        await conn.sendMessage(from, opts, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[NOVEL SEARCH]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Search Error:* ${err.message}`);
    }
});

// ══════════════════════════════════════════════════════════════
//  .novelget <b64-url> — Auto download from button
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'novelget',
    alias: ['nget', 'novelpick'],
    desc: 'Download novel from button',
    category: 'download',
    react: '📥',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const encoded = (args[0] || '').trim();
        if (!encoded) return reply('❌ Missing novel payload.');

        let novelUrl = '';
        try {
            novelUrl = Buffer.from(encoded, 'base64url').toString('utf8');
        } catch (e) {
            return reply('❌ Invalid payload.');
        }
        if (!/^https?:\/\//.test(novelUrl)) return reply('❌ Invalid URL.');

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        try {
            await downloadAndSend(conn, mek, from, novelUrl);
        } catch (err) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            reply(`❌ *Download Error:* ${err.message}`);
        }

    } catch (err) {
        console.error('[NOVELGET]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Error:* ${err.message}`);
    }
});
