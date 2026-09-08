// ============================================================
//  plugins/ytsearch-carousel.js — SHAVIYA-XMD
//  YouTube search shown as a swipeable interactive carousel
//  (same style as the TikTok search carousel).
//  Each card: thumbnail + title + duration/channel +
//  a "Download" button that triggers `.yt <video url>`.
// ============================================================

'use strict';

const axios = require('axios');
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = require('@whiskeysockets/baileys');
const { cmd } = require('../command');

const API_KEY     = "zan_vWpU1lkr_g6wwxdlvyv";
const SEARCH_API  = "https://api.zanta-mini.store/api/yts";
const MAX_RESULTS = Number(process.env.YTC_MAX_RESULTS || 8);

const HDR_TITLE  = "SHAVIYA-XMD YOUTUBE";
const HDR_FOOTER = "| POWERED BY SHAVIYA-XMD";
const CARD_FOOTER = "Sʜᴀᴠɪʏᴀ Xᴍᴅ";

// ── Helpers ──────────────────────────────────────────────────
async function react(conn, from, key, emoji) {
    try { await conn.sendMessage(from, { react: { text: emoji, key } }); } catch {}
}

function truncate(v, max) {
    const t = String(v || "").replace(/\s+/g, " ").trim();
    return t.length <= max ? t : t.slice(0, max - 1) + "\u2026";
}

function createProto(T, v) {
    if (T?.fromObject) return T.fromObject(v);
    if (T?.create) return T.create(v);
    return v;
}

async function searchYoutube(q) {
    const url = `${SEARCH_API}?apiKey=${API_KEY}&query=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url, { timeout: 15000 });
    if (!data || data.success !== true || !Array.isArray(data.results)) {
        throw new Error("No results returned from API");
    }
    return data.results.slice(0, MAX_RESULTS);
}

async function imgBuf(url) {
    const r = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const buf = Buffer.from(r.data);
    if (!buf.length) throw new Error("Empty thumbnail buffer");
    return buf;
}

async function prepHeader(conn, thumbUrl) {
    const buf = await imgBuf(thumbUrl);
    const media = await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer });
    if (!media.imageMessage) throw new Error("imageMessage not created");
    return media.imageMessage;
}

async function buildCards(conn, videos) {
    const IM = proto.Message.InteractiveMessage;
    const cards = [];

    for (const v of videos) {
        try {
            const imageMessage = await prepHeader(conn, v.thumbnail);
            const bodyText = `⏱️ ${v.duration_seconds || "N/A"}  |  📺 ${v.channelTitle || "Unknown"}`;

            cards.push(createProto(IM, {
                header: createProto(IM.Header, {
                    title: truncate(v.title, 30),
                    hasMediaAttachment: true,
                    imageMessage
                }),
                body:   createProto(IM.Body, { text: truncate(bodyText, 60) }),
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
            console.error("YT card skip:", v.title, e.message);
        }
    }
    return cards;
}

async function sendCarousel(conn, mek, from, q, videos) {
    const IM = proto.Message.InteractiveMessage;
    const CM = IM?.CarouselMessage || proto.Message.CarouselMessage;
    if (!IM || !CM) throw new Error("Proto not found");
    if (typeof conn?.relayMessage !== "function") throw new Error("relayMessage unavailable");

    const cards = await buildCards(conn, videos);
    if (!cards.length) throw new Error("No cards built");

    const im = createProto(IM, {
        header: createProto(IM.Header, { title: HDR_TITLE, hasMediaAttachment: false }),
        body:   createProto(IM.Body,   { text: `🔍 YouTube: ${q}` }),
        footer: createProto(IM.Footer, { text: HDR_FOOTER }),
        carouselMessage: createProto(CM, { cards, messageVersion: 1 })
    });

    const msg = generateWAMessageFromContent(from, {
        viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage: im } }
    }, { quoted: mek });

    await conn.relayMessage(from, msg.message, { messageId: msg.key.id });
}

async function sendFallback(conn, mek, from, q, videos) {
    const lines = [
        `🔍 *YouTube results for:* ${q}`,
        "",
        ...videos.map((v, i) =>
            `*${i + 1}.* ${truncate(v.title, 80)}\n⏱️ ${v.duration_seconds || "N/A"} | 📺 ${v.channelTitle || "Unknown"}\n${v.url}`
        )
    ];
    await conn.sendMessage(from, { text: lines.join("\n\n") }, { quoted: mek });
}

// ══════════════════════════════════════════════════════════════
//  .ytcard command
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: "yts2",
    alias: ["ytsearch2", "ytcarousel"],
    use: ".yts2 <search term>",
    react: "🔍",
    fromMe: false,
    category: "search",
    desc: "Search YouTube and show results as a swipeable carousel",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {

    const query = (q || "").trim();
    if (!query) {
        await react(conn, from, mek.key, "❌");
        return reply("❌ *Usage:* `.ytcard New Song`");
    }

    await react(conn, from, mek.key, "🔍");

    try {
        const videos = await searchYoutube(query);
        if (!videos.length) {
            await react(conn, from, mek.key, "❌");
            return reply("❌ No YouTube results found for that search.");
        }

        try {
            await sendCarousel(conn, mek, from, query, videos);
        } catch (ce) {
            console.error("YT Carousel failed, fallback:", ce.message);
            await sendFallback(conn, mek, from, query, videos);
        }

        await react(conn, from, mek.key, "✅");
    } catch (err) {
        console.error("YT Search Error:", err);
        await react(conn, from, mek.key, "❌");
        reply(`❌ YouTube search failed.\nReason: ${err?.response?.data?.message || err.message || "Unknown"}`);
    }
});
