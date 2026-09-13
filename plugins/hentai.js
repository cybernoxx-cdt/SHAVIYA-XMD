const { cmd } = require('../command');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════
//  HENTAI PLUGIN — SHAVIYA-XMD
//  Search · Qualities · Download — Number-based (No Buttons)
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
//  Title from URL
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

// ─────────────────────────────────────────────
//  Short title
// ─────────────────────────────────────────────
function shortTitle(t, max) {
    max = max || 45;
    if (!t) return 'Unknown';
    return t.length > max ? t.substring(0, max) + '…' : t;
}

// ─────────────────────────────────────────────
//  Download + Send
// ─────────────────────────────────────────────
async function downloadAndSend(conn, mek, sender, link, title, quality, url) {
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
//  .hentai <query> — SEARCH (Numbered Results)
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'hentai',
    alias: ['hsearch', 'hanime2', 'hentaisearch'],
    desc: 'Search hentai anime (Number-based)',
    category: 'anime',
    react: '🔍',
    filename: __filename
},
async (conn, mek, m, { from, args, sender, reply }) => {
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

        // Build numbered list
        let menuText = `🔍 *Search Results for:* _${q}_\n\n`;
        menuText += `📊 *Found:* ${data.total_results || data.results.length} results\n\n`;

        for (let i = 0; i < top.length; i++) {
            menuText += `*[ ${i + 1} ]* ${shortTitle(top[i].title)}\n`;
        }

        menuText += `\n💡 *Reply with number (1-${top.length}) to select*\n`;
        menuText += `> ⏳ _Menu active for 3 minutes_\n\n${CREDIT}`;

        const firstThumb = top.find(x => x.thumbnail && /^https?:\/\//.test(x.thumbnail))?.thumbnail;

        const sentMsg = await conn.sendMessage(from, {
            image: firstThumb ? { url: firstThumb } : undefined,
            text: firstThumb ? undefined : menuText,
            caption: firstThumb ? menuText : undefined
        }, { quoted: mek });

        // Remove old listener
        if (global.hentaiContexts[sender] && global.hentaiContexts[sender].listener) {
            try { conn.ev.off('messages.upsert', global.hentaiContexts[sender].listener); } catch (e) {}
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

                const store = global.hentaiContexts[sender];
                if (!store) return;
                if (ctx.stanzaId !== store.quotedId) return;

                const txt = (ext.text || '').trim();
                const num = parseInt(txt, 10);
                if (isNaN(num) || num < 1 || num > store.results.length) return;

                const selected = store.results[num - 1];
                if (!selected) return;

                // Remove this listener
                try { conn.ev.off('messages.upsert', listener); } catch (e) {}

                // Fetch download links
                await conn.sendMessage(from, { react: { text: '⏳', key: rcv.key } });

                const dlData = await apiGet('dl', selected.url);
                const links = dlData?.result?.download_links;

                if (!Array.isArray(links) || !links.length) {
                    await conn.sendMessage(from, { react: { text: '❌', key: rcv.key } });
                    return conn.sendMessage(from, {
                        text: '🚫 *Download links හමුවුණේ නෑ!*'
                    }, { quoted: rcv });
                }

                // Build quality menu
                let qText = `📺 *${shortTitle(selected.title, 60)}*\n\n`;
                qText += `💎 *Available Qualities:*\n\n`;
                for (let i = 0; i < links.length; i++) {
                    qText += `*[ ${i + 1} ]* ${links[i].quality}\n`;
                }
                qText += `\n💡 *Reply with number (1-${links.length}) to download*\n\n${CREDIT}`;

                const thumb = selected.thumbnail;

                const qMsg = await conn.sendMessage(from, {
                    image: thumb ? { url: thumb } : undefined,
                    text: thumb ? undefined : qText,
                    caption: thumb ? qText : undefined
                }, { quoted: rcv });

                // Second listener for quality selection
                const qualListener = async ({ messages: msgs }) => {
                    try {
                        const r2 = msgs[0];
                        if (!r2 || !r2.message) return;
                        if (r2.key.remoteJid !== from) return;
                        if (r2.key.fromMe) return;

                        const a2 = getMsg(r2.message);
                        const e2 = a2?.extendedTextMessage;
                        const c2 = e2?.contextInfo;
                        if (!c2 || !c2.stanzaId) return;
                        if (c2.stanzaId !== qMsg.key.id) return;

                        const t2 = (e2.text || '').trim();
                        const n2 = parseInt(t2, 10);
                        if (isNaN(n2) || n2 < 1 || n2 > links.length) return;

                        const chosen = links[n2 - 1];
                        if (!chosen) return;

                        try { conn.ev.off('messages.upsert', qualListener); } catch (e) {}

                        await downloadAndSend(
                            conn, r2, from,
                            chosen.direct_link,
                            selected.title,
                            chosen.quality,
                            selected.url
                        );

                        delete global.hentaiContexts[sender];

                    } catch (err) {
                        console.error('[HENTAI QUAL]', err.message);
                    }
                };

                global.hentaiContexts[sender] = {
                    quotedId: qMsg.key.id,
                    listener: qualListener,
                    results: store.results
                };

                conn.ev.on('messages.upsert', qualListener);

                // Auto cleanup
                setTimeout(() => {
                    const s = global.hentaiContexts[sender];
                    if (s && s.listener === qualListener) {
                        try { conn.ev.off('messages.upsert', qualListener); } catch (e) {}
                        delete global.hentaiContexts[sender];
                    }
                }, 3 * 60 * 1000);

            } catch (err) {
                console.error('[HENTAI SEARCH LISTENER]', err.message);
            }
        };

        global.hentaiContexts[sender] = {
            quotedId: sentMsg.key.id,
            results: top,
            listener: listener
        };

        conn.ev.on('messages.upsert', listener);

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        // Auto cleanup
        setTimeout(() => {
            const s = global.hentaiContexts[sender];
            if (s && s.listener === listener) {
                try { conn.ev.off('messages.upsert', listener); } catch (e) {}
                delete global.hentaiContexts[sender];
            }
        }, 3 * 60 * 1000);

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

        await downloadAndSend(conn, mek, from, best.direct_link, first.title, best.quality, first.url);

    } catch (err) {
        console.error('[HQUICK]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Error:* ${err.message}`);
    }
});
