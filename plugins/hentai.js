const { cmd } = require('../command');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════
//  HENTAI PLUGIN — SHAVIYA-XMD
//  Search · Qualities · Download
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const API_KEY = 'zan_vWpU1lkr_g6wwxdlvyv';
const API_BASE = 'https://api.zanta-mini.store/api/hentai';
const FOOTER = '👑 SHAVIYA-XMD 👑';
const CREDIT = '> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮';

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
//  Helper: title from URL slug
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

// ══════════════════════════════════════════════════════════════
//  .hentai <query> — SEARCH
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'hentai',
    alias: ['hsearch', 'hanime2', 'hentaisearch'],
    desc: 'Search hentai anime',
    category: 'anime',
    react: '🔍',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
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

        const buttons = top.map(item => {
            const short = item.title.length > 30 ? item.title.substring(0, 30) + '…' : item.title;
            const payload = Buffer.from(item.url).toString('base64url');
            return {
                buttonId: `.hget ${payload}`,
                buttonText: { displayText: `🎬 ${short}` },
                type: 1
            };
        });

        const firstThumb = top.find(x => x.thumbnail && /^https?:\/\//.test(x.thumbnail))?.thumbnail;

        const opts = {
            caption: `🔍 *Search Results for:* _${q}_\n\n📊 *Found:* ${data.total_results || data.results.length} results\n\n💡 Tap a button to see download options\n\n${CREDIT}`,
            footer: FOOTER,
            buttons: buttons,
            headerType: firstThumb ? 4 : 1
        };
        if (firstThumb) opts.image = { url: firstThumb };

        await conn.sendMessage(from, opts, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[HENTAI SEARCH]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Search Error:* ${err.message}`);
    }
});

// ══════════════════════════════════════════════════════════════
//  .hget <b64-url> — QUALITY OPTIONS
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'hget',
    alias: ['hqual', 'hlinks', 'hoptions'],
    desc: 'Get download qualities',
    category: 'anime',
    react: '📺',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const encoded = (args[0] || '').trim();
        if (!encoded) return reply('❌ Missing URL payload.');

        let videoUrl = '';
        try {
            videoUrl = Buffer.from(encoded, 'base64url').toString('utf8');
        } catch (e) {
            return reply('❌ Invalid payload.');
        }
        if (!/^https?:\/\//.test(videoUrl)) return reply('❌ Invalid URL.');

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Fetch metadata (ep) AND download links (dl) in parallel
        let meta = null;
        let dlData = null;

        try {
            const [metaRes, dlRes] = await Promise.allSettled([
                apiGet('ep', videoUrl),
                apiGet('dl', videoUrl)
            ]);
            if (metaRes.status === 'fulfilled') meta = metaRes.value;
            if (dlRes.status === 'fulfilled') dlData = dlRes.value;
        } catch (e) {
            console.log('[HGET]', e.message);
        }

        const links = dlData?.result?.download_links;
        if (!Array.isArray(links) || !links.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('🚫 *Download links හමුවුණේ නෑ!*');
        }

        const title = (meta && meta.data && meta.data.title) || titleFromUrl(videoUrl);
        const thumb = (meta && meta.data && meta.data.thumbnail) || '';

        const buttons = links.map(link => {
            const payload = Buffer.from(JSON.stringify({
                url: videoUrl,
                quality: link.quality,
                direct_link: link.direct_link,
                title: title
            })).toString('base64url');
            return {
                buttonId: `.hdl ${payload}`,
                buttonText: { displayText: `📥 ${link.quality}` },
                type: 1
            };
        });

        const caption =
            `📺 *${title}*\n\n` +
            `💎 *Available Qualities:*\n` +
            links.map(l => `• ${l.quality}`).join('\n') +
            `\n\n💡 *Tap a quality to download*\n\n${CREDIT}`;

        const opts = {
            caption,
            footer: FOOTER,
            buttons: buttons,
            headerType: thumb ? 4 : 1
        };
        if (thumb) opts.image = { url: thumb };

        await conn.sendMessage(from, opts, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[HGET]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Error:* ${err.message}`);
    }
});

// ══════════════════════════════════════════════════════════════
//  .hdl <b64-payload> — DOWNLOAD + SEND
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'hdl',
    alias: ['hdownload', 'hdl1'],
    desc: 'Download hentai video',
    category: 'anime',
    react: '📥',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const encoded = (args[0] || '').trim();
        if (!encoded) return reply('❌ Missing download payload.');

        let payload;
        try {
            payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
        } catch (e) {
            return reply('❌ Invalid payload.');
        }

        const { url, quality, direct_link, title: payloadTitle } = payload;
        if (!direct_link) return reply('❌ No direct link.');

        const title = payloadTitle || titleFromUrl(url || 'video');

        await conn.sendMessage(from, { react: { text: '📥', key: mek.key } });

        const streamRes = await axios({
            url: direct_link,
            method: 'GET',
            responseType: 'stream',
            timeout: 180000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://xanimeporn.com/'
            }
        });

        await conn.sendMessage(from, { react: { text: '📤', key: mek.key } });

        await conn.sendMessage(from, {
            video: { stream: streamRes.data },
            mimetype: 'video/mp4',
            fileName: `${title.substring(0, 40)} [${quality}].mp4`,
            caption: `🎬 *${title}*\n💎 *Quality:* ${quality}\n\n${CREDIT}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[HDL]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Download Error:* ${err.message}`);
    }
});

// ══════════════════════════════════════════════════════════════
//  .hquick — Search + auto download best quality
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'hquick',
    alias: ['hfast', 'hauto', 'hquickdl'],
    desc: 'Quick download — search and download first result',
    category: 'anime',
    react: '⚡',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
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
            text: `⚡ *Quick Download*\n\n🎬 ${first.title}\n\n⏳ Fetching links...`
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

        await conn.sendMessage(from, { react: { text: '📥', key: mek.key } });

        const streamRes = await axios({
            url: best.direct_link,
            method: 'GET',
            responseType: 'stream',
            timeout: 180000,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://xanimeporn.com/'
            }
        });

        await conn.sendMessage(from, {
            video: { stream: streamRes.data },
            mimetype: 'video/mp4',
            fileName: `${first.title.substring(0, 40)} [${best.quality}].mp4`,
            caption: `🎬 *${first.title}*\n💎 *Quality:* ${best.quality}\n\n${CREDIT}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[HQUICK]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Error:* ${err.message}`);
    }
});
