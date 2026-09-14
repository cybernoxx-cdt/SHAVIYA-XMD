const { cmd } = require('../command');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════
//  HENTAI PLUGIN — SHAVIYA-XMD
//  Search → Number → Episode → Number → Quality → Number → Download
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const API_KEY = 'zan_vWpU1lkr_g6wwxdlvyv';
const API_BASE = 'https://api.zanta-mini.store/api/hentai';
const FOOTER = '👑 SHAVIYA-XMD 👑';
const CREDIT = '> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮';
const DEBUG = true;

// ─────────────────────────────────────────────
//  Per-chat pending state
// ─────────────────────────────────────────────
if (!global._hentaiPending) global._hentaiPending = {};

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

function shortTitle(t, max) {
    max = max || 45;
    if (!t) return 'Unknown';
    return t.length > max ? t.substring(0, max) + '…' : t;
}

// ══════════════════════════════════════════════════════════════
//  GLOBAL LISTENER — number replies only
// ══════════════════════════════════════════════════════════════
function attachGlobalListener(conn) {
    if (conn._hentaiGlobalAttached) return;
    conn._hentaiGlobalAttached = true;

    conn.ev.on('messages.upsert', ({ messages, type }) => {
        try {
            if (type !== 'notify' && type !== 'append') return;

            for (const msg of messages) {
                if (!msg?.message) continue;
                if (msg.key?.fromMe) continue;

                const chatJid = msg.key.remoteJid;
                const pending = global._hentaiPending[chatJid];
                if (!pending) continue;

                // Timeout check
                if (Date.now() - pending.time > pending.timeout) {
                    if (DEBUG) console.log(`[HENTAI] ⏰ Expired for ${chatJid}`);
                    delete global._hentaiPending[chatJid];
                    continue;
                }

                const keys = Object.keys(msg.message);
                let selectedText = null;

                // ── Text reply (quoted or plain) ──
                if (keys.includes('extendedTextMessage')) {
                    selectedText = msg.message.extendedTextMessage?.text;
                } else if (keys.includes('conversation')) {
                    selectedText = msg.message.conversation;
                }

                if (!selectedText) continue;
                selectedText = String(selectedText).trim();

                if (DEBUG) {
                    console.log(`[HENTAI] 📥 Reply: "${selectedText}" | step=${pending.step}`);
                }

                // Fire callback
                const { resolve, step } = pending;
                delete global._hentaiPending[chatJid];

                try {
                    resolve({ msg, text: selectedText, step });
                } catch (e) {
                    console.error('[HENTAI] Callback error:', e.message);
                }

                break;
            }
        } catch (e) {
            console.error('[HENTAI] Listener error:', e.message);
        }
    });

    console.log('[HENTAI] ✅ Global listener attached');
}

// ══════════════════════════════════════════════════════════════
//  waitForReply (Promise)
// ══════════════════════════════════════════════════════════════
function waitForReply(conn, chatJid, step = 'unknown', timeoutMs = 180000) {
    attachGlobalListener(conn);

    return new Promise((resolve) => {
        global._hentaiPending[chatJid] = {
            step,
            time: Date.now(),
            timeout: timeoutMs,
            resolve
        };
        if (DEBUG) console.log(`[HENTAI] ⏳ Waiting (${step}) for ${chatJid}`);

        setTimeout(() => {
            if (global._hentaiPending[chatJid]) {
                if (DEBUG) console.log(`[HENTAI] ⏰ Timeout (${step})`);
                delete global._hentaiPending[chatJid];
                resolve(null);
            }
        }, timeoutMs);
    });
}

// ══════════════════════════════════════════════════════════════
//  Download + Send
// ══════════════════════════════════════════════════════════════
async function downloadAndSend(conn, mek, sender, link, title, quality, thumbUrl) {
    try {
        await conn.sendMessage(sender, { react: { text: '📥', key: mek.key } });

        if (DEBUG) console.log(`[HENTAI DL] ⬇️ ${quality}`);

        const streamRes = await axios({
            url: link,
            method: 'GET',
            responseType: 'stream',
            timeout: 300000,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://xanimeporn.com/',
                'Origin': 'https://xanimeporn.com',
                'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
            }
        });

        const chunks = [];
        for await (const c of streamRes.data) chunks.push(c);
        const buffer = Buffer.concat(chunks);
        const sizeMB = buffer.length / 1048576;

        if (DEBUG) console.log(`[HENTAI DL] ✅ ${sizeMB.toFixed(2)} MB`);

        let jpegThumbnail = null;
        if (thumbUrl) {
            try {
                const t = await axios.get(thumbUrl, { responseType: 'arraybuffer', timeout: 15000 });
                jpegThumbnail = Buffer.from(t.data);
            } catch (e) {}
        }

        await conn.sendMessage(sender, { react: { text: '📤', key: mek.key } });

        const fileName = `${String(title).substring(0, 40)} [${quality}].mp4`;
        const caption =
            `🎬 *${title}*\n` +
            `💎 *Quality:* ${quality}\n` +
            `📦 *Size:* ${sizeMB.toFixed(2)} MB\n\n` +
            `${CREDIT}`;

        if (sizeMB <= 64) {
            await conn.sendMessage(sender, {
                video: buffer,
                mimetype: 'video/mp4',
                fileName,
                caption,
                jpegThumbnail,
                seconds: 0,
                width: 1280,
                height: 720
            }, { quoted: mek });
        } else {
            await conn.sendMessage(sender, {
                document: buffer,
                mimetype: 'video/mp4',
                fileName,
                caption: caption + '\n\n_📄 Document (large)_'
            }, { quoted: mek });
        }

        await conn.sendMessage(sender, { react: { text: '✅', key: mek.key } });
    } catch (err) {
        console.error('[HENTAI DL] ❌', err.message);
        await conn.sendMessage(sender, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(sender, {
            text: `❌ *Download Error*\n\n\`${err.message}\``
        }, { quoted: mek });
    }
}

// ══════════════════════════════════════════════════════════════
//  CORE FLOW — number reply only
// ══════════════════════════════════════════════════════════════
async function hentaiFlow(conn, mek, from, q, reply) {
    attachGlobalListener(conn);

    const query = (q || '').trim();
    if (!query) return reply('❌ *Usage:* `.hentai <name>`');

    await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

    // ══════════════════════════
    //  STEP 1: SEARCH
    // ══════════════════════════
    const searchData = await apiGet('search', query);
    if (!searchData?.success || !searchData?.results?.length) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return reply(`🚫 *No results for:* _${query}_`);
    }

    const results = searchData.results.slice(0, 10);

    // Build numbered text
    let searchText = `🔍 *𝐇𝐄𝐍𝐓𝐀𝐈 𝐒𝐄𝐀𝐑𝐂𝐇*\n`;
    searchText += `━━━━━━━━━━━━━━━━━━\n\n`;
    searchText += `📝 *Query:* _${query}_\n`;
    searchText += `📊 *Found:* ${searchData.total_results || results.length}\n\n`;

    for (let i = 0; i < results.length; i++) {
        searchText += `*[ ${i + 1} ]* ${shortTitle(results[i].title, 50)}\n`;
    }

    searchText += `\n💡 *Reply with number (1-${results.length})*\n`;
    searchText += `> ⏳ _Menu active for 3 minutes_\n\n${CREDIT}`;

    const thumb0 = results.find(r => r.thumbnail && /^https?:\/\//.test(r.thumbnail))?.thumbnail;

    // Send with image if available
    if (thumb0) {
        try {
            await conn.sendMessage(from, {
                image: { url: thumb0 },
                caption: searchText
            }, { quoted: mek });
        } catch (e) {
            await conn.sendMessage(from, { text: searchText }, { quoted: mek });
        }
    } else {
        await conn.sendMessage(from, { text: searchText }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    const sel1 = await waitForReply(conn, from, 'search', 180000);
    if (!sel1) return;

    const num1 = parseInt(String(sel1.text).replace(/[^\d]/g, ''), 10);
    if (isNaN(num1) || num1 < 1 || num1 > results.length) {
        return reply('❌ Invalid selection.');
    }

    const selected = results[num1 - 1];
    if (DEBUG) console.log(`[HENTAI] Selected: ${selected.title}`);

    await conn.sendMessage(from, { react: { text: '⏳', key: sel1.msg.key } });

    // ══════════════════════════
    //  STEP 2: EPISODE / DL FETCH
    // ══════════════════════════
    const epData = await apiGet('dl', selected.url);
    if (!epData?.success) {
        await conn.sendMessage(from, { react: { text: '❌', key: sel1.msg.key } });
        return conn.sendMessage(from, { text: '🚫 *API fetch failed.*' }, { quoted: sel1.msg });
    }

    const result = epData.result || {};
    let finalUrl = selected.url;
    let finalTitle = selected.title;

    // If series → ask episode
    if (result.is_series && Array.isArray(result.episode_list) && result.episode_list.length > 0) {
        const eps = result.episode_list.slice(0, 30);

        let epText = `📺 *${shortTitle(selected.title, 50)}*\n`;
        epText += `━━━━━━━━━━━━━━━━━━\n\n`;
        epText += `📊 *Episodes:* ${result.episode_list.length}\n\n`;

        for (let i = 0; i < eps.length; i++) {
            epText += `*[ ${i + 1} ]* Episode ${eps[i].episode_number}\n`;
        }

        epText += `\n💡 *Reply with number (1-${eps.length})*\n\n${CREDIT}`;

        if (selected.thumbnail) {
            try {
                await conn.sendMessage(from, {
                    image: { url: selected.thumbnail },
                    caption: epText
                }, { quoted: sel1.msg });
            } catch (e) {
                await conn.sendMessage(from, { text: epText }, { quoted: sel1.msg });
            }
        } else {
            await conn.sendMessage(from, { text: epText }, { quoted: sel1.msg });
        }

        const sel2 = await waitForReply(conn, from, 'episode', 180000);
        if (!sel2) return;

        const num2 = parseInt(String(sel2.text).replace(/[^\d]/g, ''), 10);
        if (isNaN(num2) || num2 < 1 || num2 > eps.length) {
            return reply('❌ Invalid episode.');
        }

        const chosenEp = eps[num2 - 1];
        finalUrl = chosenEp.episode_url;
        finalTitle = `${selected.title} — Ep ${chosenEp.episode_number}`;

        await conn.sendMessage(from, { react: { text: '⏳', key: sel2.msg.key } });

        const dlData2 = await apiGet('dl', finalUrl);
        if (!dlData2?.success || !Array.isArray(dlData2?.result?.download_links)) {
            await conn.sendMessage(from, { react: { text: '❌', key: sel2.msg.key } });
            return conn.sendMessage(from, { text: '🚫 *No download links.*' }, { quoted: sel2.msg });
        }

        return await showQuality(conn, from, sel2.msg, dlData2.result.download_links, finalTitle, selected.thumbnail);
    }

    // Not a series → direct links
    if (Array.isArray(result.download_links) && result.download_links.length) {
        return await showQuality(conn, from, sel1.msg, result.download_links, finalTitle, selected.thumbnail);
    }

    await conn.sendMessage(from, { react: { text: '❌', key: sel1.msg.key } });
    return conn.sendMessage(from, { text: '🚫 *No downloadable content.*' }, { quoted: sel1.msg });
}

// ══════════════════════════════════════════════════════════════
//  STEP 3: Quality (number reply)
// ══════════════════════════════════════════════════════════════
async function showQuality(conn, from, quotedMek, links, title, thumb) {
    let qText = `📺 *${shortTitle(title, 55)}*\n`;
    qText += `━━━━━━━━━━━━━━━━━━\n\n`;
    qText += `💎 *Available Qualities:*\n\n`;

    for (let i = 0; i < links.length; i++) {
        qText += `*[ ${i + 1} ]* ${links[i].quality}\n`;
    }

    qText += `\n💡 *Reply with number (1-${links.length})*\n\n${CREDIT}`;

    if (thumb) {
        try {
            await conn.sendMessage(from, {
                image: { url: thumb },
                caption: qText
            }, { quoted: quotedMek });
        } catch (e) {
            await conn.sendMessage(from, { text: qText }, { quoted: quotedMek });
        }
    } else {
        await conn.sendMessage(from, { text: qText }, { quoted: quotedMek });
    }

    const qSel = await waitForReply(conn, from, 'quality', 180000);
    if (!qSel) return;

    const qNum = parseInt(String(qSel.text).replace(/[^\d]/g, ''), 10);
    if (isNaN(qNum) || qNum < 1 || qNum > links.length) {
        return conn.sendMessage(from, { text: '❌ Invalid quality.' }, { quoted: qSel.msg });
    }

    const chosen = links[qNum - 1];
    await downloadAndSend(conn, qSel.msg, from, chosen.direct_link, title, chosen.quality, thumb);
}

// ══════════════════════════════════════════════════════════════
//  .hentai <query>
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'hentai',
    alias: ['hsearch', 'hanime2', 'hentaisearch'],
    desc: 'Search hentai anime (Number reply based)',
    category: 'anime',
    react: '🔍',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        await hentaiFlow(conn, mek, from, args.join(' '), reply);
    } catch (err) {
        console.error('[HENTAI]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Error:* ${err.message}`);
    }
});

// ══════════════════════════════════════════════════════════════
//  .hquick <query> — best quality auto
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'hquick',
    alias: ['hfast', 'hauto'],
    desc: 'Quick download — best quality',
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
        if (!searchData?.results?.length) return reply('🚫 No results found.');

        const first = searchData.results[0];
        await conn.sendMessage(from, {
            text: `⚡ *Quick Download*\n\n🎬 ${shortTitle(first.title)}\n\n⏳ Fetching...`
        }, { quoted: mek });

        const dlData = await apiGet('dl', first.url);
        const res = dlData?.result || {};

        let targetUrl = first.url;
        let targetTitle = first.title;

        if (res.is_series && Array.isArray(res.episode_list) && res.episode_list.length) {
            targetUrl = res.episode_list[0].episode_url;
            targetTitle = `${first.title} — Ep ${res.episode_list[0].episode_number}`;
        }

        const dlData2 = await apiGet('dl', targetUrl);
        const links = dlData2?.result?.download_links;
        if (!Array.isArray(links) || !links.length) return reply('🚫 No download links.');

        const best = links.find(l => l.quality === '1080p')
                  || links.find(l => l.quality === '720p')
                  || links[0];

        await downloadAndSend(conn, mek, from, best.direct_link, targetTitle, best.quality, first.thumbnail);
    } catch (err) {
        console.error('[HQUICK]', err.message);
        reply(`❌ *Error:* ${err.message}`);
    }
});
