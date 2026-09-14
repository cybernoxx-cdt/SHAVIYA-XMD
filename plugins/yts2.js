// ============================================================
//  plugins/ytsearch-carousel.js — SHAVIYA-XMD
//  YouTube search → Carousel → Download
//  Created by: Savendra Dampriya
// ============================================================

'use strict';

const axios = require('axios');
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = require('@whiskeysockets/baileys');
const { cmd } = require('../command');

// yt-search for search
let yts;
try { yts = require('yt-search'); } catch (e) { console.log('[YT] yt-search not installed'); }

// ytdl for download
let ytdl;
try { ytdl = require('ytdl-core'); } catch (e) {
    try { ytdl = require('@distube/ytdl-core'); }
    catch (e2) { console.log('[YT] ytdl-core not installed'); }
}

const MAX_RESULTS = 8;
const DEBUG = true;

const HDR_TITLE   = "SHAVIYA-XMD YOUTUBE";
const HDR_FOOTER  = "| POWERED BY SHAVIYA-XMD";
const CARD_FOOTER = "Sʜᴀᴠɪʏᴀ Xᴍᴅ";

// Store search results per user (for reply-based download)
if (!global.ytSearchStore) global.ytSearchStore = {};

// ── Helpers ──
async function react(conn, from, key, emoji) {
    try { await conn.sendMessage(from, { react: { text: emoji, key } }); } catch {}
}

function truncate(v, max) {
    const t = String(v || "").replace(/\s+/g, " ").trim();
    return t.length <= max ? t : t.slice(0, max - 1) + "…";
}

function createProto(T, v) {
    if (T?.fromObject) return T.fromObject(v);
    if (T?.create) return T.create(v);
    return v;
}

async function searchYoutube(q) {
    if (!yts) throw new Error("yt-search not installed");
    const r = await yts(q);
    return (r.videos || []).slice(0, MAX_RESULTS).map(v => ({
        title: v.title,
        url: v.url,
        videoId: v.videoId,
        thumbnail: v.thumbnail,
        duration_seconds: v.timestamp || "N/A",
        channelTitle: v.author?.name || "Unknown"
    }));
}

async function imgBuf(url) {
    const r = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    return Buffer.from(r.data);
}

async function prepHeader(conn, thumbUrl) {
    const buf = await imgBuf(thumbUrl);
    const media = await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer });
    return media.imageMessage;
}

async function buildCards(conn, videos) {
    const IM = proto.Message.InteractiveMessage;
    const cards = [];

    for (const v of videos) {
        try {
            const imageMessage = await prepHeader(conn, v.thumbnail);
            cards.push(createProto(IM, {
                header: createProto(IM.Header, {
                    title: truncate(v.title, 30),
                    hasMediaAttachment: true,
                    imageMessage
                }),
                body: createProto(IM.Body, {
                    text: truncate(`⏱️ ${v.duration_seconds} | 📺 ${v.channelTitle}`, 60)
                }),
                footer: createProto(IM.Footer, { text: CARD_FOOTER }),
                nativeFlowMessage: createProto(IM.NativeFlowMessage, {
                    buttons: [{
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "📥 Download",
                            id: `.yt ${v.url}`
                        })
                    }]
                })
            }));
        } catch (e) {
            console.error("Card skip:", v.title, e.message);
        }
    }
    return cards;
}

async function sendCarousel(conn, mek, from, q, videos) {
    const IM = proto.Message.InteractiveMessage;
    const CM = IM.CarouselMessage || proto.Message.CarouselMessage;

    const cards = await buildCards(conn, videos);
    if (!cards.length) throw new Error("No cards");

    const im = createProto(IM, {
        header: createProto(IM.Header, { title: HDR_TITLE, hasMediaAttachment: false }),
        body: createProto(IM.Body, { text: `🔍 YouTube: ${q}` }),
        footer: createProto(IM.Footer, { text: HDR_FOOTER }),
        carouselMessage: createProto(CM, { cards, messageVersion: 1 })
    });

    const msg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: im
            }
        }
    }, { quoted: mek });

    await conn.relayMessage(from, msg.message, { messageId: msg.key.id });
}

// ─────────────────────────────────────────────
//  .yts2 — Search
// ─────────────────────────────────────────────
cmd({
    pattern: "yts2",
    alias: ["ytsearch2", "ytcarousel"],
    react: "🔍",
    category: "search",
    desc: "YouTube search carousel",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {

    const query = (q || "").trim();
    if (!query) {
        await react(conn, from, mek.key, "❌");
        return reply("❌ Usage: `.yts2 <song name>`");
    }

    await react(conn, from, mek.key, "🔍");

    try {
        const videos = await searchYoutube(query);
        if (!videos.length) {
            await react(conn, from, mek.key, "❌");
            return reply("❌ No results found.");
        }

        // Save for later use
        global.ytSearchStore[sender] = {
            results: videos,
            time: Date.now()
        };

        try {
            await sendCarousel(conn, mek, from, query, videos);
        } catch (ce) {
            console.error("Carousel failed:", ce.message);
            // Fallback text
            const lines = [`🔍 *YouTube:* ${query}\n`];
            videos.forEach((v, i) => {
                lines.push(`*${i + 1}.* ${truncate(v.title, 70)}\n⏱️ ${v.duration_seconds} | 📺 ${v.channelTitle}\n${v.url}`);
            });
            lines.push(`\n_Reply with number or use \`.yt <url>\`_`);
            await conn.sendMessage(from, { text: lines.join("\n\n") }, { quoted: mek });
        }

        await react(conn, from, mek.key, "✅");
    } catch (err) {
        console.error("YT Error:", err);
        await react(conn, from, mek.key, "❌");
        reply(`❌ Search failed: ${err.message}`);
    }
});

// ─────────────────────────────────────────────
//  .yt <url> — Download video
// ─────────────────────────────────────────────
cmd({
    pattern: "yt",
    alias: ["ytdl", "ytvideo"],
    react: "📥",
    category: "download",
    desc: "Download YouTube video",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const url = (q || "").trim();
        if (!url || !url.includes("youtu")) {
            return reply("❌ Usage: `.yt <youtube-url>`");
        }

        await react(conn, from, mek.key, "⏳");

        if (!ytdl) {
            await react(conn, from, mek.key, "❌");
            return reply("❌ Downloader not available. Install: `npm i @distube/ytdl-core`");
        }

        // Get info
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title;

        // Pick best video quality
        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highest',
            filter: 'audioandvideo'
        });

        if (!format) throw new Error("No video format found");

        // Download stream
        const stream = ytdl(url, { format });
        const chunks = [];

        await new Promise((resolve, reject) => {
            stream.on('data', c => chunks.push(c));
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        const buffer = Buffer.concat(chunks);
        const sizeMB = (buffer.length / 1048576).toFixed(2);

        // Send video
        await conn.sendMessage(from, {
            video: buffer,
            mimetype: "video/mp4",
            caption: `📹 *${title}*\n💾 ${sizeMB} MB\n🛡️ 𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃`
        }, { quoted: mek });

        await react(conn, from, mek.key, "✅");

    } catch (err) {
        console.error("YT DL Error:", err.message);
        await react(conn, from, mek.key, "❌");
        reply(`❌ Download failed: ${err.message}`);
    }
});

// ─────────────────────────────────────────────
//  .yta <url> — Download audio only (MP3)
// ─────────────────────────────────────────────
cmd({
    pattern: "yta",
    alias: ["ytaudio", "ytmp3"],
    react: "🎵",
    category: "download",
    desc: "Download YouTube audio",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const url = (q || "").trim();
        if (!url || !url.includes("youtu")) {
            return reply("❌ Usage: `.yta <youtube-url>`");
        }

        await react(conn, from, mek.key, "⏳");

        if (!ytdl) {
            await react(conn, from, mek.key, "❌");
            return reply("❌ Downloader not available.");
        }

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title;

        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        const stream = ytdl(url, { format });
        const chunks = [];
        await new Promise((resolve, reject) => {
            stream.on('data', c => chunks.push(c));
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        const buffer = Buffer.concat(chunks);
        const sizeMB = (buffer.length / 1048576).toFixed(2);

        await conn.sendMessage(from, {
            audio: buffer,
            mimetype: "audio/mp4",
            ptt: false,
            fileName: `${title}.m4a`
        }, { quoted: mek });

        await react(conn, from, mek.key, "✅");

    } catch (err) {
        console.error("YT Audio Error:", err.message);
        await react(conn, from, mek.key, "❌");
        reply(`❌ Audio failed: ${err.message}`);
    }
});
