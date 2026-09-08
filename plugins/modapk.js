// ============================================================
//  plugins/modapk.js — SHAVIYA-XMD
//  MOD APK Search & Download
//  Uses Zanta APIs:
//    Search   -> /api/modapk/search
//    Download -> /api/modapk/dl
// ============================================================

'use strict';

const { cmd }  = require('../command');
const axios    = require('axios');

const API_KEY     = "zan_vWpU1lkr_g6wwxdlvyv";
const SEARCH_API  = "https://api.zanta-mini.store/api/modapk/search";
const DL_API      = "https://api.zanta-mini.store/api/modapk/dl";
const MAX_RESULTS = 10;
const MAX_MB      = 1900; // WhatsApp document limit safety margin

const footer = "> © Powerd by Sʜᴀᴠɪʏᴀ-Xᴍᴅ 🌝";

async function searchModApk(query) {
    const url = `${SEARCH_API}?apiKey=${API_KEY}&url=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { timeout: 15000 });
    if (!data || data.success !== true || !Array.isArray(data.result) || !data.result.length) {
        throw new Error('NO_RESULTS');
    }
    return data.result.slice(0, MAX_RESULTS);
}

async function fetchDownloadInfo(pageUrl) {
    const url = `${DL_API}?apiKey=${API_KEY}&url=${encodeURIComponent(pageUrl)}`;
    const { data } = await axios.get(url, { timeout: 20000 });
    if (!data || data.success !== true || !data.download_url) {
        throw new Error('NO_DOWNLOAD_LINK');
    }
    return {
        title:      data.info?.title || 'MOD APK',
        android:    data.info?.android || 'N/A',
        size:       data.info?.size || 'Unknown',
        thumbnail:  data.info?.thumbnail || null,
        downloadUrl: data.download_url
    };
}

function safeFileName(title) {
    const cleaned = String(title || 'app')
        .replace(/download/gi, '')
        .replace(/free on android/gi, '')
        .replace(/[^a-zA-Z0-9 ._-]/g, '')
        .trim();
    return (cleaned || 'modapk').substring(0, 60);
}

cmd({
    pattern: "modapk",
    alias: ["mapk", "apkmod"],
    use: ".modapk <game or app name>",
    react: "📦",
    desc: "Search and download MOD APKs.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { q, from, reply }) => {

    try {
        if (!q || !q.trim()) return reply("❌ *Usage:* `.modapk Hill Climb Racing`");

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        let results;
        try {
            results = await searchModApk(q.trim());
        } catch (e) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No MOD APK results found for that search.");
        }

        let listText = "📦 *SHAVIYA-XMD MOD APK SEARCH*\n\n🔢 *Reply with a number to download.*\n\n";
        results.forEach((item, i) => {
            listText += `*${i + 1}.* ${item.title}\n_${item.developer || 'Unknown developer'}_\n\n`;
        });

        const listMsg = await conn.sendMessage(
            from,
            {
                image: { url: results[0].thumbnail || "https://i.ibb.co/7XvXZyy/youtube-logo.png" },
                caption: listText + footer
            },
            { quoted: mek }
        );

        await conn.sendMessage(from, { react: { text: "🔢", key: mek.key } });

        const listener = async ({ messages }) => {
            const replyMsg = messages[0];
            if (!replyMsg?.message) return;

            const replyContext = replyMsg.message.extendedTextMessage?.contextInfo;
            const isReplyToBot = replyContext?.stanzaId === listMsg.key.id;
            if (!isReplyToBot) return;

            const userReply = (
                replyMsg.message.extendedTextMessage?.text ||
                replyMsg.message.conversation || ''
            ).trim();
            const index = parseInt(userReply) - 1;

            if (isNaN(index) || index < 0 || index >= results.length) {
                return conn.sendMessage(from, {
                    text: `❌ *Enter a number between 1 and ${results.length}!*`
                }, { quoted: replyMsg });
            }

            // One-shot: remove listener immediately
            conn.ev.off('messages.upsert', listener);
            clearTimeout(timeout);

            const chosen = results[index];

            try {
                await conn.sendMessage(from, { react: { text: "⬇️", key: replyMsg.key } });
                await conn.sendMessage(from, {
                    text: "⬇️ *Fetching download link...*"
                }, { quoted: replyMsg });

                let info;
                try {
                    info = await fetchDownloadInfo(chosen.url);
                } catch (e) {
                    await conn.sendMessage(from, { react: { text: "❌", key: replyMsg.key } });
                    return conn.sendMessage(from, {
                        text: "❌ *Couldn't get a download link for this app. Try another result.*"
                    }, { quoted: replyMsg });
                }

                // Best-effort file size check
                const head = await axios.head(info.downloadUrl).catch(() => null);
                const sizeBytes = head?.headers['content-length'];
                const sizeMB = sizeBytes ? (sizeBytes / (1024 * 1024)).toFixed(2) : null;

                if (sizeMB && parseFloat(sizeMB) > MAX_MB) {
                    await conn.sendMessage(from, { react: { text: "❌", key: replyMsg.key } });
                    return conn.sendMessage(from, {
                        text: `⚠️ *File too large:* ${sizeMB} MB (max ${MAX_MB} MB). Can't send via WhatsApp.`
                    }, { quoted: replyMsg });
                }

                const stream = await axios({
                    method: 'get',
                    url: info.downloadUrl,
                    responseType: 'stream',
                    timeout: 60000
                });

                const caption =
`📦 *MOD APK DOWNLOAD*

*Title:* ${info.title}
*Android:* ${info.android}
*Size:* ${info.size}

${footer}`;

                await conn.sendMessage(from, {
                    document: { stream: stream.data },
                    mimetype: 'application/vnd.android.package-archive',
                    fileName: `${safeFileName(info.title)}.apk`,
                    caption
                }, { quoted: replyMsg });

                await conn.sendMessage(from, { react: { text: "✅", key: replyMsg.key } });

            } catch (err) {
                console.error('[MODAPK DOWNLOAD ERROR]', err.message);
                await conn.sendMessage(from, { react: { text: "❌", key: replyMsg.key } });
                await conn.sendMessage(from, {
                    text: "❌ *Download failed.* Server or network error."
                }, { quoted: replyMsg });
            }
        };

        conn.ev.on('messages.upsert', listener);

        const timeout = setTimeout(() => {
            conn.ev.off('messages.upsert', listener);
        }, 120_000);

    } catch (err) {
        console.error('[MODAPK CMD ERROR]', err.message);
        reply("❌ Error: " + err.message);
    }
});
