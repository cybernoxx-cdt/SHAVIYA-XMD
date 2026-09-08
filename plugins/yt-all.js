// ============================================================
//  yt-all.js — SHAVIYA-XMD
//  YouTube Downloader — Search by name or direct URL
//  Uses Zanta APIs:
//    Search   -> /api/yts
//    Download -> /api/ytmp4-v2
// ============================================================

const { cmd }  = require('../command');
const axios    = require('axios');

const API_KEY      = "zan_vWpU1lkr_g6wwxdlvyv";
const SEARCH_API   = "https://api.zanta-mini.store/api/yts";
const DOWNLOAD_API = "https://api.zanta-mini.store/api/ytmp4-v2";

const fakevCard = {
    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: {
        contactMessage: {
            displayName: '⚡ Sʜᴀᴠɪʏᴀ Xᴍᴅ',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SHAVIYA-XMD\nORG:© Mr Savendra;\nTEL;type=CELL;type=VOICE;waid=94707085822:+94707085822\nEND:VCARD`
        }
    }
};

function isValidLink(v) {
    return typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'not found';
}

function formatDuration(totalSeconds) {
    const s = Number(totalSeconds);
    if (!s || isNaN(s)) return 'Unknown';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Resolves any user input (search words OR a direct link) into a
// canonical YouTube URL, using the search API when it's not already a link.
async function resolveVideoUrl(query) {
    const isUrl = /^https?:\/\//i.test(query);
    if (isUrl) return query;

    const { data } = await axios.get(
        `${SEARCH_API}?apiKey=${API_KEY}&query=${encodeURIComponent(query)}`,
        { timeout: 15000 }
    );

    if (!data || data.success !== true || !Array.isArray(data.results) || !data.results.length) {
        throw new Error('NO_SEARCH_RESULTS');
    }

    return data.results[0].url;
}

// Calls the download/info API and normalizes the result shape.
async function fetchVideoInfo(videoUrl) {
    const { data } = await axios.get(
        `${DOWNLOAD_API}?apiKey=${API_KEY}&url=${encodeURIComponent(videoUrl)}`,
        { timeout: 30000 }
    );

    if (!data || data.success !== true || !data.result) {
        throw new Error('DOWNLOAD_API_FAILED');
    }

    const r = data.result;
    const videoLink = r.links?.download;
    const audioLink = r.links?.audio;

    if (!isValidLink(videoLink)) {
        throw new Error('NO_VIDEO_LINK');
    }

    return {
        title:      r.title || 'YouTube Video',
        thumbnail:  r.thumbnail || 'https://i.ibb.co/7XvXZyy/youtube-logo.png',
        duration:   formatDuration(r.duration),
        sourceUrl:  r.source_url || videoUrl,
        videoLink,
        audioLink:  isValidLink(audioLink) ? audioLink : null
    };
}

cmd({
    pattern:  'yt',
    alias:    ['youtube', 'ytdl', 'ytmp3'],
    react:    '🎬',
    desc:     'Download YouTube videos or audio by name/link',
    category: 'download',
    use:      '.yt <title or link>',
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        // ── 1. Get query ──────────────────────────────────
        const query = q?.trim();

        if (!query) {
            return reply(
                `╭━━━〔 🎬 *YOUTUBE DOWNLOADER* 〕━━━╮\n` +
                `┃\n` +
                `┃ ⚠️ *Usage:* .yt <title or link>\n` +
                `┃\n` +
                `┃ 📌 *Examples:*\n` +
                `┃  .yt Lelena Nilan Hettiarachchi\n` +
                `┃  .yt https://youtube.com/watch?v=...\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━━━━╯`
            );
        }

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // ── 2. Resolve to a real video URL (search if needed) ──
        let videoUrl;
        try {
            videoUrl = await resolveVideoUrl(query);
        } catch (e) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('❌ *ඔබ සෙවූ Video එක සොයාගත නොහැක!*');
        }

        // ── 3. Fetch video info + download links ───────────
        let info;
        try {
            info = await fetchVideoInfo(videoUrl);
        } catch (e) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            if (e.message === 'NO_VIDEO_LINK') {
                return reply('❌ *මෙම Video එකට Download Link එකක් සොයාගත නොහැක.*');
            }
            return reply('❌ *Download API එකෙන් Response එකක් ලැබුණේ නැහැ. පසුව උත්සාහ කරන්න.*');
        }

        // ── 4. Build menu based on what's actually available ──
        const hasAudio = !!info.audioLink;

        const menuText =
`╭━━━〔 🎬 *YOUTUBE DOWNLOADER* 〕━━━╮
┃
┃ 📌 *Title:* ${info.title.substring(0, 40)}
┃ ⏱️ *Duration:* ${info.duration}
┃ 🔗 *Link:* ${info.sourceUrl}
┃
┃ 🎥 *VIDEO*
┃  1️⃣ | Video (MP4)
┃  2️⃣ | Video as Document
┃${hasAudio ? `
┃ 🎵 *AUDIO*
┃  3️⃣ | Audio (MP3)
┃  4️⃣ | Audio as Document
┃` : `
┃ 🎵 *AUDIO:* Not available for this video
┃`}
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *කරුණාකර ඔබට අවශ්‍ය Format එකට Reply කරන්න!*`;

        // ── 5. Send menu with thumbnail ───────────────────
        const listMsg = await conn.sendMessage(from, {
            image:   { url: info.thumbnail },
            caption: menuText,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid:     '120363317972190466@newsletter',
                    newsletterName:    '𝗦𝗛𝗔𝗩𝗜𝗬𝗔-𝗫𝗠𝗗 𝗩𝟮',
                    serverMessageId:   143
                }
            }
        }, { quoted: fakevCard });

        await conn.sendMessage(from, { react: { text: '🔢', key: mek.key } });

        // ── 6. Format map (only options that actually exist) ──
        const options = {
            1: { t: 'video' },
            2: { t: 'doc' },
            ...(hasAudio ? {
                3: { t: 'audio' },
                4: { t: 'doc_audio' }
            } : {})
        };
        const maxChoice = hasAudio ? 4 : 2;

        // ── 7. One-shot reply listener ────────────────────
        const listener = async ({ messages }) => {
            const replyMsg = messages[0];
            if (!replyMsg?.message) return;

            const replyContext  = replyMsg.message.extendedTextMessage?.contextInfo;
            const isReplyToBot  = replyContext?.stanzaId === listMsg.key.id;
            if (!isReplyToBot) return;

            const userReply = (
                replyMsg.message.extendedTextMessage?.text ||
                replyMsg.message.conversation || ''
            ).trim();
            const choice = parseInt(userReply);

            if (isNaN(choice) || !options[choice]) {
                return conn.sendMessage(from, {
                    text: `❌ *1 සිට ${maxChoice} දක්වා නිවැරදි අංකයක් Reply කරන්න!*`
                }, { quoted: replyMsg });
            }

            // Remove listener immediately (one-shot)
            conn.ev.off('messages.upsert', listener);
            clearTimeout(timeout);

            const selected = options[choice];
            const isAudioType = selected.t === 'audio' || selected.t === 'doc_audio';
            const downloadUrl = isAudioType ? info.audioLink : info.videoLink;

            try {
                await conn.sendMessage(from, { react: { text: '⬇️', key: replyMsg.key } });
                await conn.sendMessage(from, {
                    text: `⬇️ *Downloading...*\n_මෙය සුළු වේලාවක් ගතවනු ඇත_`
                }, { quoted: replyMsg });

                const safeTitle = info.title.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'youtube_media';

                // Check file size (best-effort, some hosts don't return content-length)
                const head       = await axios.head(downloadUrl).catch(() => null);
                const sizeBytes  = head?.headers['content-length'];
                const fileSizeMB = sizeBytes ? (sizeBytes / (1024 * 1024)).toFixed(2) : 0;

                if (sizeBytes && parseFloat(fileSizeMB) > 1900) {
                    await conn.sendMessage(from, { react: { text: '❌', key: replyMsg.key } });
                    return conn.sendMessage(from, {
                        text: `⚠️ *File Size:* ${fileSizeMB} MB — ගොනුව ලොකු වැඩියි! (max 1.9GB)`
                    }, { quoted: replyMsg });
                }

                // Stream download
                const stream = await axios({ method: 'get', url: downloadUrl, responseType: 'stream' });

                const finalCaption =
`╭━━━〔 📥 *YOUTUBE DOWNLOADER* 〕━━━╮
┃
┃ 🎬 *Title:* ${info.title.substring(0, 30)}
┃ ⏱️ *Duration:* ${info.duration}
┃ ⚖️ *Size:* ${fileSizeMB > 0 ? fileSizeMB + ' MB' : 'Unknown'}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> ⚡ *Powered by Sʜᴀᴠɪʏᴀ Xᴍᴅ*`;

                if (selected.t === 'video') {
                    await conn.sendMessage(from, {
                        video:    { stream: stream.data },
                        mimetype: 'video/mp4',
                        caption:  finalCaption
                    }, { quoted: replyMsg });

                } else if (selected.t === 'doc') {
                    await conn.sendMessage(from, {
                        document: { stream: stream.data },
                        mimetype: 'video/mp4',
                        fileName: `${safeTitle}.mp4`,
                        caption:  finalCaption
                    }, { quoted: replyMsg });

                } else if (selected.t === 'audio') {
                    await conn.sendMessage(from, {
                        audio:    { stream: stream.data },
                        mimetype: 'audio/mpeg',
                        ptt:      false
                    }, { quoted: replyMsg });

                } else if (selected.t === 'doc_audio') {
                    await conn.sendMessage(from, {
                        document: { stream: stream.data },
                        mimetype: 'audio/mpeg',
                        fileName: `${safeTitle}.mp3`,
                        caption:  finalCaption
                    }, { quoted: replyMsg });
                }

                await conn.sendMessage(from, { react: { text: '✅', key: replyMsg.key } });

            } catch (dlErr) {
                console.error('[YT DOWNLOAD ERROR]', dlErr.message);
                await conn.sendMessage(from, { react: { text: '❌', key: replyMsg.key } });
                await conn.sendMessage(from, {
                    text: '❌ *Download Failed!* Server Error.'
                }, { quoted: replyMsg });
            }
        };

        conn.ev.on('messages.upsert', listener);

        // Auto-remove after 2 minutes
        const timeout = setTimeout(() => {
            conn.ev.off('messages.upsert', listener);
        }, 120_000);

    } catch (e) {
        console.error('[YT CMD ERROR]', e.message);
        reply('❌ *API Error. Please try again.*');
    }
});
