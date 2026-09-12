const { cmd } = require('../command');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════
//  SINHALA NOVEL DOWNLOADER — SHAVIYA-XMD
//  Search · Download Options · PDF Download
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

// ══════════════════════════════════════════════════════════════
//  .novel <query> — SEARCH
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'novel',
    alias: ['book', 'ebook', 'sinhalanovel'],
    desc: 'Search Sinhala novels (PDF)',
    category: 'download',
    react: '📚',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const q = (args.join(' ') || '').trim();
        if (!q) return reply('❌ *Usage:* `.novel <name>`\n💡 උදා: `.novel new`');

        await conn.sendMessage(from, { react: { text: '📚', key: mek.key } });

        const data = await apiGet('search', q);

        if (!data || !data.success || !Array.isArray(data.results) || !data.results.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`🚫 *No results found for:* _${q}_`);
        }

        const top = data.results.slice(0, 10);

        const buttons = top.map(item => {
            const short = item.title.length > 30 ? item.title.substring(0, 30) + '…' : item.title;
            const payload = Buffer.from(item.url).toString('base64url');
            return {
                buttonId: `.ndl ${payload}`,
                buttonText: { displayText: `📖 ${short}` },
                type: 1
            };
        });

        const firstThumb = top.find(x => x.thumbnail && /^https?:\/\//.test(x.thumbnail))?.thumbnail;

        const opts = {
            caption: `📚 *Search Results for:* _${q}_\n\n📊 *Found:* ${data.count || data.results.length} results\n\n💡 Tap a button to download\n\n${CREDIT}`,
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
//  .ndl <b64-url> — DOWNLOAD PDF
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'ndl',
    alias: ['noveldl', 'bookdl'],
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

        const data = await apiGet('dl', novelUrl);

        if (!data || !data.success || !Array.isArray(data.download_links) || !data.download_links.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('🚫 *Download links හමුවුණේ නෑ!*');
        }

        const title = data.title || 'Novel';
        const thumbnail = data.thumbnail || '';

        // Find the DOWNLOAD link (not READ ONLINE)
        const downloadLink = data.download_links.find(l => l.label === 'DOWNLOAD')
                          || data.download_links.find(l => /pdf/i.test(l.url))
                          || data.download_links[data.download_links.length - 1];

        if (!downloadLink) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('🚫 *Download link හමුවුණේ නෑ!*');
        }

        await conn.sendMessage(from, { react: { text: '📥', key: mek.key } });

        // Follow redirects to get the actual PDF
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
        await conn.sendMessage(from, {
            document: { stream: streamRes.data },
            mimetype: 'application/pdf',
            fileName: `${safeTitle} (${BYPASS_TAG}).pdf`,
            caption: `📚 *${title}*\n\n_${BYPASS_TAG}_\n\n${CREDIT}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[NDL]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Download Error:* ${err.message}`);
    }
});

// ══════════════════════════════════════════════════════════════
//  .nquick <query> — SEARCH + DOWNLOAD FIRST RESULT
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'nquick',
    alias: ['nfast', 'bookquick'],
    desc: 'Search and download first novel result',
    category: 'download',
    react: '⚡',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const q = (args.join(' ') || '').trim();
        if (!q) return reply('❌ *Usage:* `.nquick <name>`');

        await conn.sendMessage(from, { react: { text: '⚡', key: mek.key } });

        const searchData = await apiGet('search', q);
        if (!searchData?.results?.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('🚫 No results found.');
        }

        const first = searchData.results[0];
        await conn.sendMessage(from, {
            text: `⚡ *Quick Download*\n\n📖 ${first.title}\n\n⏳ Fetching download link...`
        }, { quoted: mek });

        const dlData = await apiGet('dl', first.url);
        if (!dlData?.success || !dlData.download_links?.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('🚫 No download links.');
        }

        const downloadLink = dlData.download_links.find(l => l.label === 'DOWNLOAD')
                          || dlData.download_links.find(l => /pdf/i.test(l.url))
                          || dlData.download_links[dlData.download_links.length - 1];

        if (!downloadLink) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('🚫 Download link not found.');
        }

        await conn.sendMessage(from, { react: { text: '📥', key: mek.key } });

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

        const title = dlData.title || first.title || 'Novel';
        const safeTitle = cleanTitle(title);

        await conn.sendMessage(from, {
            document: { stream: streamRes.data },
            mimetype: 'application/pdf',
            fileName: `${safeTitle} (${BYPASS_TAG}).pdf`,
            caption: `📚 *${title}*\n\n_${BYPASS_TAG}_\n\n${CREDIT}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[NQUICK]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Error:* ${err.message}`);
    }
});
