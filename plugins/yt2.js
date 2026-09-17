// ============================================================
//  yt2.js — SHAVIYA-XMD
//  Backup/Alternative YouTube Downloader — quality picker
//  Video: movanest.xyz (240p/360p/480p/720p, video or document)
//  Audio: api-aswin-sparky / back.asitha.top (fallback pair)
//  Use this if .yt (zanta-mini API) is ever down.
// ============================================================

const axios = require('axios');
const yts = require('yt-search');
const { cmd } = require('../command');

const BRAND = "🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮";

const fakevCard = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "⚡ Sʜᴀᴠɪʏᴀ Xᴍᴅ",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Sʜᴀᴠɪʏᴀ Xᴍᴅ\nORG:SHAVIYA XMD;\nTEL;type=CELL;type=VOICE;waid=94707085822:+94707085822\nEND:VCARD`
        }
    }
};

function safeName(name) {
    return String(name || 'youtube_media').replace(/[^\w\s]/gi, '').trim() || 'youtube_media';
}

cmd({
    pattern:  "yt2",
    alias:    ["ytvideo2", "song", "play"],
    react:    "🎬",
    desc:     "Backup YouTube downloader — video (quality picker) + audio",
    category: "download",
    use:      ".yt2 <title or link>",
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        // ── 1. Get query ──────────────────────────────────
        let query = q?.trim();

        if (!query && m?.quoted) {
            query =
                m.quoted.message?.conversation ||
                m.quoted.message?.extendedTextMessage?.text ||
                m.quoted.text;
        }

        if (!query) {
            return reply(
                `${BRAND}\n\n` +
                `⚠️ *Usage:* .yt2 <title or YouTube link>\n` +
                `📌 *Example:* .yt2 Believer Imagine Dragons`
            );
        }

        // ── 2. Shorts link → normal link ──────────────────
        if (query.includes("youtube.com/shorts/")) {
            const videoId = query.split("/shorts/")[1].split(/[?&]/)[0];
            query = `https://www.youtube.com/watch?v=${videoId}`;
        }

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // ── 3. Search ─────────────────────────────────────
        const search = await yts(query);
        if (!search.videos.length) {
            return reply(`${BRAND}\n\n❌ *No results found for:* _${query}_`);
        }

        const data  = search.videos[0];
        const ytUrl = data.url;

        // ── 4. Video quality API map (movanest.xyz, lazy — only
        //      called when a quality is actually picked) ──────
        const videoFormats = {
            "240p": `https://www.movanest.xyz/v2/ytdl2?input=${encodeURIComponent(ytUrl)}&format=video&quality=240p`,
            "360p": `https://www.movanest.xyz/v2/ytdl2?input=${encodeURIComponent(ytUrl)}&format=video&quality=360p`,
            "480p": `https://www.movanest.xyz/v2/ytdl2?input=${encodeURIComponent(ytUrl)}&format=video&quality=480p`,
            "720p": `https://www.movanest.xyz/v2/ytdl2?input=${encodeURIComponent(ytUrl)}&format=video&quality=720p`,
        };

        // ── 5. Menu ────────────────────────────────────────
        const caption =
`${BRAND}

🎵 *Title* › ${data.title}
⏱️ *Duration* › ${data.timestamp}
📆 *Uploaded* › ${data.ago}
👁️ *Views* › ${data.views.toLocaleString()}
🔗 *Link* › ${data.url}

📌 *Reply with a number to download*

🎞️ *Video File*
  ┣ *1* › 240p  📱
  ┣ *2* › 360p  📺
  ┣ *3* › 480p  🖥️
  ┗ *4* › 720p  🔥

📂 *Video as Document*
  ┣ *5* › 240p  📱
  ┣ *6* › 360p  📺
  ┣ *7* › 480p  🖥️
  ┗ *8* › 720p  🔥

🎧 *Audio*
  ┣ *9*  › MP3 Audio
  ┗ *10* › MP3 Document`;

        const sentMsg = await conn.sendMessage(from, {
            image:   { url: data.thumbnail },
            caption,
        }, { quoted: fakevCard });

        const messageID = sentMsg.key.id;

        // ── 6. Option map ──────────────────────────────────
        const optionMap = {
            "1": { kind: "video", quality: "240p", isDoc: false },
            "2": { kind: "video", quality: "360p", isDoc: false },
            "3": { kind: "video", quality: "480p", isDoc: false },
            "4": { kind: "video", quality: "720p", isDoc: false },
            "5": { kind: "video", quality: "240p", isDoc: true  },
            "6": { kind: "video", quality: "360p", isDoc: true  },
            "7": { kind: "video", quality: "480p", isDoc: true  },
            "8": { kind: "video", quality: "720p", isDoc: true  },
            "9":  { kind: "audio", isDoc: false },
            "10": { kind: "audio", isDoc: true  },
        };

        // ── 7. One-shot reply listener ─────────────────────
        const listener = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message) return;

                const receivedText = (
                    receivedMsg.message.conversation ||
                    receivedMsg.message.extendedTextMessage?.text || ''
                ).trim();

                const senderID     = receivedMsg.key.remoteJid;
                const isReplyToBot =
                    receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                if (!isReplyToBot || senderID !== from) return;

                const selected = optionMap[receivedText];
                if (!selected) {
                    return conn.sendMessage(senderID, {
                        text: `${BRAND}\n\n❌ *Invalid option!* Reply with a number between *1–10*`,
                    }, { quoted: receivedMsg });
                }

                // Remove listener after a valid reply (one-shot)
                conn.ev.off("messages.upsert", listener);
                clearTimeout(timeout);

                await conn.sendMessage(senderID, { react: { text: '⬇️', key: receivedMsg.key } });

                // ═══════════════ AUDIO PATH ═══════════════
                if (selected.kind === "audio") {
                    await conn.sendMessage(senderID, {
                        text: `⏳ *Fetching audio...*\n_Please wait a moment_`
                    }, { quoted: receivedMsg });

                    const [api1Res, api2Res] = await Promise.allSettled([
                        axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(ytUrl)}`, { timeout: 12000 }),
                        axios.get(`https://back.asitha.top/api/ytapi?url=${encodeURIComponent(ytUrl)}&fo=2&qu=128&apiKey=390f34ac879d9cbad9192a073a9431d6fdc482d79bdd126acee7599905d8e904`, { timeout: 12000 }),
                    ]);

                    const songUrl =
                        (api1Res.status === "fulfilled" && api1Res.value.data?.status && api1Res.value.data?.data?.url)
                            ? api1Res.value.data.data.url
                        : (api2Res.status === "fulfilled" && api2Res.value.data?.downloadData?.url)
                            ? api2Res.value.data.downloadData.url
                        : null;

                    if (!songUrl) {
                        await conn.sendMessage(senderID, { react: { text: '❌', key: receivedMsg.key } });
                        return conn.sendMessage(senderID, {
                            text: `${BRAND}\n\n❌ *Audio download failed!* Try again later.`
                        }, { quoted: receivedMsg });
                    }

                    await conn.sendMessage(senderID, { react: { text: '⬆️', key: receivedMsg.key } });

                    if (selected.isDoc) {
                        const buffer = await axios.get(songUrl, { responseType: "arraybuffer" });
                        await conn.sendMessage(senderID, {
                            document: buffer.data,
                            mimetype: "audio/mpeg",
                            fileName: `${safeName(data.title)}.mp3`,
                            caption: `${BRAND}\n\n🎵 *${data.title}*\n📂 *Type:* Document`
                        }, { quoted: receivedMsg });
                    } else {
                        await conn.sendMessage(senderID, {
                            audio: { url: songUrl },
                            mimetype: "audio/mpeg",
                        }, { quoted: receivedMsg });
                    }

                    return conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
                }

                // ═══════════════ VIDEO PATH ═══════════════
                const { quality, isDoc } = selected;

                await conn.sendMessage(senderID, {
                    text: `⏳ *Downloading ${quality} ${isDoc ? 'document' : 'video'}...*\n_Please wait a moment_`
                }, { quoted: receivedMsg });

                const { data: apiRes } = await axios.get(videoFormats[quality], { timeout: 30000 });

                if (
                    !apiRes?.status ||
                    !apiRes?.results?.success ||
                    !apiRes.results.recommended?.dlurl
                ) {
                    await conn.sendMessage(senderID, { react: { text: '❌', key: receivedMsg.key } });
                    return conn.sendMessage(senderID, {
                        text: `${BRAND}\n\n❌ *Download failed for ${quality}!*\n_Try a different quality._`
                    }, { quoted: receivedMsg });
                }

                const downloadUrl = apiRes.results.recommended.dlurl;

                await conn.sendMessage(senderID, { react: { text: '⬆️', key: receivedMsg.key } });

                const sendCaption =
`${BRAND}

🎵 *${data.title}*
📊 *Quality:* ${quality}
${isDoc ? '📂 *Type:* Document' : '🎞️ *Type:* Video'}`;

                if (isDoc) {
                    await conn.sendMessage(senderID, {
                        document: { url: downloadUrl },
                        mimetype: "video/mp4",
                        fileName: `${safeName(data.title)}_${quality}.mp4`,
                        caption:  sendCaption,
                    }, { quoted: receivedMsg });
                } else {
                    await conn.sendMessage(senderID, {
                        video:    { url: downloadUrl },
                        mimetype: "video/mp4",
                        caption:  sendCaption,
                        ptt:      false,
                    }, { quoted: receivedMsg });
                }

                await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });

            } catch (err) {
                console.error("[YT2 LISTENER]", err.message);
                await conn.sendMessage(from, {
                    text: `${BRAND}\n\n❌ *An error occurred!*\n_${err.message}_`
                }, { quoted: mek });
            }
        };

        conn.ev.on("messages.upsert", listener);

        // Auto-remove listener after 3 minutes to prevent memory leak
        const timeout = setTimeout(() => {
            conn.ev.off("messages.upsert", listener);
        }, 180_000);

    } catch (error) {
        console.error("[YT2 CMD]", error.message);
        reply(`${BRAND}\n\n❌ *An error occurred!*\n_${error.message}_`);
    }
});
