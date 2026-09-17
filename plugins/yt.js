// ============================================================
//  yt.js — SHAVIYA-XMD
//  YouTube Downloader — Search by name OR direct URL
//  API: whiteshadow-x-api.onrender.com
//  Created by: Savendra Dampriya
// ============================================================

const { cmd }  = require('../command');
const axios    = require('axios');

const API_KEY      = "e76n2P";
const SEARCH_API   = "https://api.zanta-mini.store/api/yts";
const DOWNLOAD_API = "https://whiteshadow-x-api.onrender.com/api/download/ytdlfast";

const BRAND = "🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮";

const fakevCard = {
    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: {
        contactMessage: {
            displayName: '⚡ Sʜᴀᴠɪʏᴀ Xᴍᴅ',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SHAVIYA-XMD\nORG:© Mr Savendra;\nTEL;type=CELL;type=VOICE;waid=94707085822:+94707085822\nEND:VCARD`
        }
    }
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function isValidLink(v) {
    return typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'not found';
}

function formatDuration(totalSeconds) {
    const s = Number(String(totalSeconds).replace(/[^0-9]/g, ''));
    if (!s || isNaN(s)) return 'Unknown';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function humanFileSize(bytes) {
    if (!bytes) return 'Unknown';
    const mb = bytes / 1048576;
    if (mb < 1) return (bytes / 1024).toFixed(1) + ' KB';
    return mb.toFixed(2) + ' MB';
}

// ─────────────────────────────────────────────
//  Resolve query → YouTube URL (search if not URL)
// ─────────────────────────────────────────────
async function resolveVideoUrl(query) {
    const isUrl = /^https?:\/\//i.test(query) || /^youtu\.?be\//i.test(query);
    if (isUrl) return query;

    const { data } = await axios.get(
        `${SEARCH_API}?apiKey=zan_vWpU1lkr_g6wwxdlvyv&query=${encodeURIComponent(query)}`,
        { timeout: 15000 }
    );

    if (!data || data.success !== true || !Array.isArray(data.results) || !data.results.length) {
        throw new Error('NO_SEARCH_RESULTS');
    }
    return data.results[0].url;
}

// ─────────────────────────────────────────────
//  Fetch from WhiteShadow API
// ─────────────────────────────────────────────
async function fetchVideoInfo(videoUrl) {
    const url = `${DOWNLOAD_API}?url=${encodeURIComponent(videoUrl)}&apitoken=${API_KEY}`;
    console.log('[YT] Fetching:', url);

    const { data } = await axios.get(url, { timeout: 30000 });

    if (!data || data.success !== true || !data.result) {
        throw new Error('API_FAILED');
    }

    const meta = data.metadata || {};
    const r = data.result || {};

    // Dedupe video qualities by quality string
    const seenVideo = new Set();
    const videos = (r.video || [])
        .filter(v => {
            const key = v.quality;
            if (seenVideo.has(key)) return false;
            seenVideo.add(key);
            return true;
        })
        .map(v => ({
            quality: v.quality,
            format: v.format,
            url: v.url
        }));

    // Dedupe audio
    const seenAudio = new Set();
    const audios = (r.audio || [])
        .filter(a => {
            const key = a.quality;
            if (seenAudio.has(key)) return false;
            seenAudio.add(key);
            return true;
        })
        .map(a => ({
            quality: a.quality,
            format: a.format,
            url: a.url
        }));

    if (!videos.length && !audios.length) {
        throw new Error('NO_LINKS');
    }

    return {
        title:      meta.title || 'YouTube Video',
        thumbnail:  meta.thumbnail || 'https://i.ibb.co/7XvXZyy/youtube-logo.png',
        duration:   formatDuration(meta.duration),
        videos,
        audios
    };
}

// ─────────────────────────────────────────────
//  Build menu options (numbered)
// ─────────────────────────────────────────────
function buildMenu(info) {
    const options = {};
    const lines = [];

    let num = 0;

    // Video qualities
    if (info.videos.length) {
        lines.push(`🎬 *VIDEO*`);
        for (const v of info.videos) {
            num++;
            const q = v.quality.replace(/^mp4\s*\(|\)$/g, '').replace(/^webm\s*\(|\)$/g, '');
            const fmt = v.format.toUpperCase();
            options[num] = { type: 'video', data: v };
            lines.push(`  *${num}️⃣* ${v.quality}`);
        }
    }

    // Audio qualities
    if (info.audios.length) {
        if (lines.length) lines.push('');
        lines.push(`🎵 *AUDIO*`);
        for (const a of info.audios) {
            num++;
            options[num] = { type: 'audio', data: a };
            lines.push(`  *${num}️⃣* ${a.quality}`);
        }
    }

    return { options, lines, maxChoice: num };
}

// ─────────────────────────────────────────────
//  Main command
// ─────────────────────────────────────────────
cmd({
    pattern:  'yt',
    alias:    ['youtube', 'ytdl', 'ytmp3', 'ytmp4'],
    react:    '🎬',
    desc:     'Download YouTube videos or audio by name/link',
    category: 'download',
    use:      '.yt <title or link>',
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        const query = q?.trim();

        if (!query) {
            return reply(
                `${BRAND}\n\n` +
                `⚠️ *Usage:* .yt <title or link>\n\n` +
                `📌 *Examples:*\n` +
                `  .yt Lelena Nilan Hettiarachchi\n` +
                `  .yt https://youtu.be/M7y9sIvMGjw`
            );
        }

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // 1. Resolve URL
        let videoUrl;
        try {
            videoUrl = await resolveVideoUrl(query);
        } catch (e) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`${BRAND}\n\n❌ *Video එක සොයාගත නොහැක!*`);
        }

        // 2. Fetch info
        let info;
        try {
            info = await fetchVideoInfo(videoUrl);
        } catch (e) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`${BRAND}\n\n❌ *Download API Error. පසුව උත්සාහ කරන්න.*`);
        }

        // 3. Build menu
        const { options, lines, maxChoice } = buildMenu(info);

        const menuText =
            `${BRAND}\n\n` +
            `📌 *Title:* ${info.title.substring(0, 45)}\n` +
            `⏱️ *Duration:* ${info.duration}\n\n` +
            `${lines.join('\n')}\n\n` +
            `> *ඔබට අවශ්‍ය Option එකේ අංකය Reply කරන්න!* (1-${maxChoice})`;

        // 4. Send menu with thumbnail
        const listMsg = await conn.sendMessage(from, {
            image:   { url: info.thumbnail },
            caption: menuText
        }, { quoted: fakevCard });

        await conn.sendMessage(from, { react: { text: '🔢', key: mek.key } });

        // 5. Reply listener
        const listener = async ({ messages }) => {
            try {
                const replyMsg = messages[0];
                if (!replyMsg?.message) return;
                if (replyMsg.key.fromMe) return;

                const replyContext = replyMsg.message.extendedTextMessage?.contextInfo;
                const isReplyToBot = replyContext?.stanzaId === listMsg.key.id;
                if (!isReplyToBot) return;

                const userReply = (
                    replyMsg.message.extendedTextMessage?.text ||
                    replyMsg.message.conversation || ''
                ).trim();

                const choice = parseInt(userReply, 10);
                if (isNaN(choice) || !options[choice]) {
                    return conn.sendMessage(from, {
                        text: `${BRAND}\n\n❌ *1 සිට ${maxChoice} දක්වා අංකයක් Reply කරන්න!*`
                    }, { quoted: replyMsg });
                }

                // One-shot
                conn.ev.off('messages.upsert', listener);
                clearTimeout(timeout);

                const selected = options[choice];
                const downloadUrl = selected.data.url;

                try {
                    await conn.sendMessage(from, { react: { text: '⬇️', key: replyMsg.key } });
                    await conn.sendMessage(from, {
                        text: `⬇️ *Downloading...*\n📦 ${selected.data.quality}\n_මෙය සුළු වේලාවක් ගතවනු ඇත_`
                    }, { quoted: replyMsg });

                    const safeTitle = info.title.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 40) || 'youtube_media';

                    // Get file size
                    const head = await axios.head(downloadUrl, { timeout: 10000 }).catch(() => null);
                    const sizeBytes = head?.headers['content-length'];
                    const sizeMB = sizeBytes ? (sizeBytes / 1048576).toFixed(2) : 0;

                    if (sizeBytes && parseFloat(sizeMB) > 1900) {
                        await conn.sendMessage(from, { react: { text: '❌', key: replyMsg.key } });
                        return conn.sendMessage(from, {
                            text: `⚠️ *File Size:* ${sizeMB} MB — ලොකු වැඩියි! (max 1.9GB)`
                        }, { quoted: replyMsg });
                    }

                    // Stream
                    const stream = await axios({
                        method: 'get',
                        url: downloadUrl,
                        responseType: 'stream',
                        timeout: 300000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });

                    const caption =
                        `${BRAND}\n\n` +
                        `🎬 *${info.title.substring(0, 40)}*\n` +
                        `⏱️ *Duration:* ${info.duration}\n` +
                        `📦 *Quality:* ${selected.data.quality}\n` +
                        `⚖️ *Size:* ${sizeBytes ? sizeMB + ' MB' : 'Unknown'}`;

                    if (selected.type === 'video') {
                        // WhatsApp video limit 64MB
                        if (sizeBytes && parseFloat(sizeMB) > 64) {
                            // Send as document
                            await conn.sendMessage(from, {
                                document: { stream: stream.data },
                                mimetype: 'video/mp4',
                                fileName: `${safeTitle}.mp4`,
                                caption: caption + '\n\n_📄 Document (large file)_'
                            }, { quoted: replyMsg });
                        } else {
                            await conn.sendMessage(from, {
                                video:    { stream: stream.data },
                                mimetype: 'video/mp4',
                                caption:  caption
                            }, { quoted: replyMsg });
                        }
                    } else {
                        // Audio
                        await conn.sendMessage(from, {
                            audio:    { stream: stream.data },
                            mimetype: 'audio/mpeg',
                            ptt:      false
                        }, { quoted: replyMsg });

                        await conn.sendMessage(from, { text: caption }, { quoted: replyMsg });
                    }

                    await conn.sendMessage(from, { react: { text: '✅', key: replyMsg.key } });

                } catch (dlErr) {
                    console.error('[YT DL ERROR]', dlErr.message);
                    await conn.sendMessage(from, { react: { text: '❌', key: replyMsg.key } });
                    await conn.sendMessage(from, {
                        text: `${BRAND}\n\n❌ *Download Failed!* ${dlErr.message}`
                    }, { quoted: replyMsg });
                }
            } catch (e) {
                console.error('[YT LISTENER]', e.message);
            }
        };

        conn.ev.on('messages.upsert', listener);

        const timeout = setTimeout(() => {
            try { conn.ev.off('messages.upsert', listener); } catch (e) {}
        }, 180000);

    } catch (e) {
        console.error('[YT CMD ERROR]', e.message);
        reply(`${BRAND}\n\n❌ *Error: ${e.message}*`);
    }
});
