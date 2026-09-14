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
const DEBUG = true; // ← Set false later

// ─────────────────────────────────────────────
//  Pending sessions (user → callback)
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
//  GLOBAL LISTENER — capture ALL incoming messages
// ══════════════════════════════════════════════════════════════
function setupGlobalListener(conn) {
    if (conn._hentaiListenerAttached) return;
    conn._hentaiListenerAttached = true;

    conn.ev.on('messages.upsert', ({ messages, type }) => {
        try {
            if (type !== 'notify' && type !== 'append') return;

            for (const msg of messages) {
                if (!msg?.message) continue;
                if (msg.key.fromMe) continue;

                const from = msg.key.remoteJid;
                const sender = msg.key.participant || from;

                // Check if this user has a pending session
                const pending = global._hentaiPending[sender];
                if (!pending) continue;

                // Timeout check
                if (Date.now() - pending.time > pending.timeout) {
                    delete global._hentaiPending[sender];
                    continue;
                }

                const keys = Object.keys(msg.message);
                let selectedText = null;

                if (DEBUG) console.log(`[HENTAI] Incoming keys:`, keys.join(', '), `| from:`, sender);

                // ── List reply ──
                if (keys.includes('listResponseMessage')) {
                    const lr = msg.message.listResponseMessage;
                    const id = lr?.singleSelectReply?.selectedRowId
                            || lr?.singleSelectReply?.selectedRowID;
                    if (DEBUG) console.log(`[HENTAI] List selected:`, id);
                    if (id) selectedText = String(id).trim();
                }

                // ── Interactive / Native ──
                if (!selectedText && keys.includes('interactiveResponseMessage')) {
                    try {
                        const inter = msg.message.interactiveResponseMessage;
                        const native = inter?.nativeFlowResponseMessage;
                        if (native) {
                            const parsed = JSON.parse(native.paramsJson || "{}");
                            const id = parsed.id || native.name || "";
                            if (id) selectedText = String(id).trim();
                        }
                    } catch (e) {}
                }

                // ── Buttons ──
                if (!selectedText && keys.includes('buttonsResponseMessage')) {
                    const id = msg.message.buttonsResponseMessage?.selectedButtonId;
                    if (id) selectedText = String(id).trim();
                }

                // ── Number reply (any text with digits) ──
                if (!selectedText && keys.includes('extendedTextMessage')) {
                    const txt = msg.message.extendedTextMessage?.text || "";
                    if (txt) selectedText = txt.trim();
                }
                if (!selectedText && keys.includes('conversation')) {
                    const txt = msg.message.conversation || "";
                    if (txt) selectedText = txt.trim();
                }

                if (!selectedText) continue;

                if (DEBUG) console.log(`[HENTAI] Selected text:`, selectedText);

                // Fire callback
                try { pending.callback(msg, selectedText); } catch (e) {
                    console.error('[HENTAI] Callback error:', e.message);
                }

                // Remove pending (once-only)
                delete global._hentaiPending[sender];

                // Break so one message doesn't trigger twice
                break;
            }
        } catch (e) {
            console.error('[HENTAI] Global listener error:', e.message);
        }
    });

    if (DEBUG) console.log('[HENTAI] ✅ Global listener attached');
}

// ══════════════════════════════════════════════════════════════
//  Wait for reply (Promise based on global listener)
// ══════════════════════════════════════════════════════════════
function waitForReply(conn, from, sender, timeoutMs = 180000) {
    setupGlobalListener(conn);

    return new Promise((resolve) => {
        global._hentaiPending[sender] = {
            time: Date.now(),
            timeout: timeoutMs,
            callback: (msg, text) => {
                resolve({ msg, text });
            }
        };

        // Timeout cleanup
        setTimeout(() => {
            if (global._hentaiPending[sender]) {
                if (DEBUG) console.log(`[HENTAI] ⏱️ Timeout for ${sender}`);
                delete global._hentaiPending[sender];
                resolve(null);
            }
        }, timeoutMs);
    });
}

// ─────────────────────────────────────────────
//  Download + Send
// ─────────────────────────────────────────────
async function downloadAndSend(conn, mek, sender, link, title, quality, thumbUrl) {
    try {
        await conn.sendMessage(sender, { react: { text: '📥', key: mek.key } });

        const streamRes = await axios({
            url: link, method: 'GET', responseType: 'stream',
            timeout: 300000, maxRedirects: 5,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://xanimeporn.com/' }
        });

        const chunks = [];
        for await (const chunk of streamRes.data) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        const sizeMB = buffer.length / 1048576;

        // Thumbnail
        let jpegThumbnail = null;
        if (thumbUrl) {
            try {
                const t = await axios.get(thumbUrl, { responseType: 'arraybuffer', timeout: 15000 });
                jpegThumbnail = Buffer.from(t.data);
            } catch (e) {}
        }

        await conn.sendMessage(sender, { react: { text: '📤', key: mek.key } });

        const fileName = `${title.substring(0, 40)} [${quality}].mp4`;
        const caption = `🎬 *${title}*\n💎 *Quality:* ${quality}\n📦 *Size:* ${sizeMB.toFixed(2)} MB\n\n${CREDIT}`;

        if (sizeMB <= 64) {
            await conn.sendMessage(sender, {
                video: buffer,
                mimetype: 'video/mp4',
                fileName: fileName,
                caption: caption,
                jpegThumbnail: jpegThumbnail,
                seconds: 0,
                width: 1280,
                height: 720
            }, { quoted: mek });
        } else {
            await conn.sendMessage(sender, {
                document: buffer,
                mimetype: 'video/mp4',
                fileName: fileName,
                caption: caption + '\n\n_📄 Sent as document_'
            }, { quoted: mek });
        }

        await conn.sendMessage(sender, { react: { text: '✅', key: mek.key } });
    } catch (err) {
        console.error('[HENTAI DL]', err.message);
        await conn.sendMessage(sender, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(sender, { text: `❌ *Download Error:* ${err.message}` }, { quoted: mek });
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
async (conn, mek, m, { from, args, sender, reply }) => {
    try {
        // ✅ Attach listener at command start
        setupGlobalListener(conn);

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

        let sentMsg;
        if (firstThumb) {
            try {
                sentMsg = await conn.sendMessage(from, {
                    image: { url: firstThumb },
                    ...menuPayload
                }, { quoted: mek });
            } catch (e) {
                if (DEBUG) console.log('[HENTAI] Image send failed, text only:', e.message);
                sentMsg = await conn.sendMessage(from, menuPayload, { quoted: mek });
            }
        } else {
            sentMsg = await conn.sendMessage(from, menuPayload, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        if (DEBUG) console.log(`[HENTAI] Menu sent. Waiting for selection...`);

        // ─── Wait for user selection (global listener) ───
        const selection = await waitForReply(conn, from, sender, 180000);
        if (!selection) {
            if (DEBUG) console.log('[HENTAI] No selection (timeout)');
            return;
        }

        if (DEBUG) console.log(`[HENTAI] User selected: ${selection.text}`);

        const num = parseInt(String(selection.text).replace(/[^\d]/g, ''), 10);
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
            return conn.sendMessage(from, { text: '🚫 *No download links.*' }, { quoted: selection.msg });
        }

        // ─── Quality menu ───
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

        const qPayload = {
            text: qText,
            footer: FOOTER,
            title: '💎 Select Quality',
            buttonText: '📥 𝐒𝐄𝐋𝐄𝐂𝐓 𝐐𝐔𝐀𝐋𝐈𝐓𝐘',
            sections: [{ title: '🎬 Available Qualities', rows: qRows }]
        };

        let qMsg;
        if (selected.thumbnail) {
            try {
                qMsg = await conn.sendMessage(from, {
                    image: { url: selected.thumbnail },
                    ...qPayload
                }, { quoted: selection.msg });
            } catch (e) {
                qMsg = await conn.sendMessage(from, qPayload, { quoted: selection.msg });
            }
        } else {
            qMsg = await conn.sendMessage(from, qPayload, { quoted: selection.msg });
        }

        // ─── Wait for quality selection ───
        const qSel = await waitForReply(conn, from, sender, 180000);
        if (!qSel) return;

        const qNum = parseInt(String(qSel.text).replace(/[^\d]/g, ''), 10);
        if (isNaN(qNum) || qNum < 1 || qNum > links.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: qSel.msg.key } });
            return reply('❌ Invalid quality.');
        }

        const chosen = links[qNum - 1];
        await downloadAndSend(conn, qSel.msg, from, chosen.direct_link, selected.title, chosen.quality, selected.thumbnail);

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

        await downloadAndSend(conn, mek, from, best.direct_link, first.title, best.quality, first.thumbnail);
    } catch (err) {
        console.error('[HQUICK]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Error:* ${err.message}`);
    }
});
