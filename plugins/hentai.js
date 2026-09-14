const { cmd } = require('../command');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════
//  HENTAI PLUGIN — SHAVIYA-XMD
//  Search → Episode → Quality → Download
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const API_KEY = 'zan_vWpU1lkr_g6wwxdlvyv';
const API_BASE = 'https://api.zanta-mini.store/api/hentai';
const FOOTER = '👑 SHAVIYA-XMD 👑';
const CREDIT = '> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮';
const DEBUG = true;

// ─────────────────────────────────────────────
//  Per-chat pending state
//  { [chatJid]: { step, data, resolve, time, timeout } }
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
//  🔥 GLOBAL LISTENER (single, robust)
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

                // Expired?
                if (Date.now() - pending.time > pending.timeout) {
                    if (DEBUG) console.log(`[HENTAI] ⏰ Expired for ${chatJid}`);
                    delete global._hentaiPending[chatJid];
                    continue;
                }

                const keys = Object.keys(msg.message);
                let selectedText = null;

                if (DEBUG) {
                    console.log(`[HENTAI] 📥 Keys: ${keys.join(', ')} | step=${pending.step}`);
                }

                // ── List reply ──
                if (keys.includes('listResponseMessage')) {
                    const lr = msg.message.listResponseMessage;
                    const id = lr?.singleSelectReply?.selectedRowId
                            || lr?.singleSelectReply?.selectedRowID;
                    if (id) selectedText = String(id).trim();
                }
                // ── Native flow ──
                else if (keys.includes('interactiveResponseMessage')) {
                    try {
                        const nf = msg.message.interactiveResponseMessage?.nativeFlowResponseMessage;
                        if (nf) {
                            const p = JSON.parse(nf.paramsJson || '{}');
                            selectedText = p.id || nf.name || null;
                        }
                    } catch (e) {}
                }
                // ── Buttons ──
                else if (keys.includes('buttonsResponseMessage')) {
                    selectedText = msg.message.buttonsResponseMessage?.selectedButtonId;
                }
                // ── Text ──
                else if (keys.includes('extendedTextMessage')) {
                    selectedText = msg.message.extendedTextMessage?.text;
                }
                else if (keys.includes('conversation')) {
                    selectedText = msg.message.conversation;
                }

                if (!selectedText) continue;
                selectedText = String(selectedText).trim();

                if (DEBUG) console.log(`[HENTAI] ✅ Selected: "${selectedText}"`);

                // Fire callback
                const { resolve, step } = pending;
                delete global._hentaiPending[chatJid];

                try {
                    resolve({ msg, text: selectedText, step });
                } catch (e) {
                    console.error('[HENTAI] Callback:', e.message);
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
        if (DEBUG) console.log(`[HENTAI] ⏳ Waiting (step=${step}) for ${chatJid}`);

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
//  sendMenu helper — sends list with image or text fallback
// ══════════════════════════════════════════════════════════════
async function sendMenu(conn, from, mek, { imageUrl, bodyText, title, buttonText, rows, sectionTitle }) {
    const payload = {
        text: bodyText,
        footer: FOOTER,
        title,
        buttonText,
        sections: [{ title: sectionTitle, rows }]
    };

    if (imageUrl) {
        try {
            return await conn.sendMessage(from, { image: { url: imageUrl }, ...payload }, { quoted: mek });
        } catch (e) {
            if (DEBUG) console.log('[HENTAI] Image send failed, using text:', e.message);
            return await conn.sendMessage(from, payload, { quoted: mek });
        }
    }
    return await conn.sendMessage(from, payload, { quoted: mek });
}

// ══════════════════════════════════════════════════════════════
//  Download + Send
// ══════════════════════════════════════════════════════════════
async function downloadAndSend(conn, mek, sender, link, title, quality, thumbUrl) {
    try {
        await conn.sendMessage(sender, { react: { text: '📥', key: mek.key } });

        if (DEBUG) console.log(`[HENTAI DL] ⬇️ ${quality} → ${link.slice(0, 80)}...`);

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

        if (DEBUG) console.log(`[HENTAI DL] ✅ Downloaded ${sizeMB.toFixed(2)} MB`);

        // Thumbnail
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
                caption: caption + '\n\n_📄 Sent as document (large)_'
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
//  🎯 CORE FLOW — search → episode (if series) → quality → download
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

    const searchRows = results.map((item, i) => ({
        title: `${i + 1}. ${shortTitle(item.title, 55)}`,
        description: `🎬 Tap to select`,
        rowId: String(i + 1)
    }));

    const thumb0 = results.find(r => r.thumbnail && /^https?:\/\//.test(r.thumbnail))?.thumbnail;

    await sendMenu(conn, from, mek, {
        imageUrl: thumb0,
        bodyText:
            `🔍 *Search Results*\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +
            `📝 *Query:* _${query}_\n` +
            `📊 *Found:* ${searchData.total_results || results.length}\n\n` +
            `👇 *Tap a result or reply with number (1-${results.length})*\n\n` +
            `${CREDIT}`,
        title: '🔍 Hentai Search',
        buttonText: '📋 𝐒𝐄𝐋𝐄𝐂𝐓 𝐑𝐄𝐒𝐔𝐋𝐓',
        rows: searchRows,
        sectionTitle: '🎬 Search Results'
    });

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
    //  STEP 2: EPISODE FETCH
    //  (API 'dl' returns either {download_links} OR {is_series, episode_list})
    // ══════════════════════════
    const epData = await apiGet('dl', selected.url);
    if (!epData?.success) {
        await conn.sendMessage(from, { react: { text: '❌', key: sel1.msg.key } });
        return conn.sendMessage(from, { text: '🚫 *API fetch failed.*' }, { quoted: sel1.msg });
    }

    const result = epData.result || {};
    let finalUrl = selected.url;      // URL we will fetch download_links from
    let finalTitle = selected.title;

    // If API returned is_series + episode_list → ask user to pick episode
    if (result.is_series && Array.isArray(result.episode_list) && result.episode_list.length > 0) {
        const eps = result.episode_list;

        const epRows = eps.slice(0, 30).map((ep, i) => ({
            title: `Episode ${ep.episode_number}`,
            description: `${shortTitle(ep.episode_title, 50)}`,
            rowId: String(i + 1)
        }));

        await sendMenu(conn, from, sel1.msg, {
            imageUrl: selected.thumbnail,
            bodyText:
                `📺 *${shortTitle(selected.title, 55)}*\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `📊 *Episodes:* ${eps.length}\n\n` +
                `👇 *Tap episode or reply with number (1-${Math.min(eps.length, 30)})*\n\n` +
                `${CREDIT}`,
            title: '📺 Select Episode',
            buttonText: '🎬 𝐒𝐄𝐋𝐄𝐂𝐓 𝐄𝐏𝐈𝐒𝐎𝐃𝐄',
            rows: epRows,
            sectionTitle: '🎬 Episodes'
        });

        const sel2 = await waitForReply(conn, from, 'episode', 180000);
        if (!sel2) return;

        const num2 = parseInt(String(sel2.text).replace(/[^\d]/g, ''), 10);
        if (isNaN(num2) || num2 < 1 || num2 > eps.length) {
            return reply('❌ Invalid episode.');
        }

        const chosenEp = eps[num2 - 1];
        finalUrl = chosenEp.episode_url;
        finalTitle = `${selected.title} — ${chosenEp.episode_title}`;

        await conn.sendMessage(from, { react: { text: '⏳', key: sel2.msg.key } });

        // Fetch dl links for that episode
        const dlData2 = await apiGet('dl', finalUrl);
        if (!dlData2?.success || !Array.isArray(dlData2?.result?.download_links)) {
            await conn.sendMessage(from, { react: { text: '❌', key: sel2.msg.key } });
            return conn.sendMessage(from, { text: '🚫 *No download links found for this episode.*' }, { quoted: sel2.msg });
        }

        return await showQualityAndDownload(conn, from, sel2.msg, dlData2.result.download_links, finalTitle, selected.thumbnail);
    }

    // Not a series → check if already has download_links
    if (Array.isArray(result.download_links) && result.download_links.length) {
        return await showQualityAndDownload(conn, from, sel1.msg, result.download_links, finalTitle, selected.thumbnail);
    }

    // Fallback: no episodes, no links
    await conn.sendMessage(from, { react: { text: '❌', key: sel1.msg.key } });
    return conn.sendMessage(from, { text: '🚫 *No downloadable content for this result.*' }, { quoted: sel1.msg });
}

// ══════════════════════════════════════════════════════════════
//  STEP 3: Quality menu + download
// ══════════════════════════════════════════════════════════════
async function showQualityAndDownload(conn, from, quotedMek, links, title, thumb) {
    const qRows = links.map((l, i) => ({
        title: `${i + 1}. ${l.quality}`,
        description: `📥 Download in ${l.quality}`,
        rowId: String(i + 1)
    }));

    await sendMenu(conn, from, quotedMek, {
        imageUrl: thumb,
        bodyText:
            `📺 *${shortTitle(title, 55)}*\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +
            `💎 *Available Qualities:*\n\n` +
            `👇 *Tap a quality or reply with number (1-${links.length})*\n\n` +
            `${CREDIT}`,
        title: '💎 Select Quality',
        buttonText: '📥 𝐒𝐄𝐋𝐄𝐂𝐓 𝐐𝐔𝐀𝐋𝐈𝐓𝐘',
        rows: qRows,
        sectionTitle: '🎬 Qualities'
    });

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
    desc: 'Search hentai anime (Menu Selection + Episodes)',
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
//  .hquick <query> — best quality (auto)
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

        // If series → pick first episode
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
