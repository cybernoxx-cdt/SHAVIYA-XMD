// ============================================================
//  plugins/ytsearch-carousel.js — SHAVIYA-XMD
//  YouTube Search → Side-Scroll Carousel (Dnuzi Baileys)
//  Created by: Savendra Dampriya
// ============================================================

'use strict';

const axios = require('axios');
const { cmd } = require('../command');

let baileys;
try { baileys = require('@dnuzi/baileys'); }
catch (err) {
    try { baileys = require('@whiskeysockets/baileys'); }
    catch (err) {
        try { baileys = require('@adiwajshing/baileys'); }
        catch (e) { console.error("Baileys not found!"); }
    }
}

const {
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    proto
} = baileys;

const MAX_RESULTS = Number(process.env.YTC_MAX_RESULTS || 10);
const DEBUG = true;

const HDR_TITLE   = "🎬 SHAVIYA-XMD YOUTUBE";
const HDR_FOOTER  = "⚡ Powered by SHAVIYA-XMD";
const CARD_FOOTER = "🎵 Sʜᴀᴠɪʏᴀ Xᴍᴅ";

// ─────────────── Helpers ───────────────
async function react(conn, from, key, emoji) {
    try { await conn.sendMessage(from, { react: { text: emoji, key } }); } catch {}
}

function truncate(v, max) {
    const t = String(v || "").replace(/\s+/g, " ").trim();
    return t.length <= max ? t : t.slice(0, max - 1) + "…";
}

function createProto(T, v) {
    if (!T) return v;
    if (T.fromObject) return T.fromObject(v);
    if (T.create) return T.create(v);
    return v;
}

// ─────────────── YouTube Search (multiple sources) ───────────────
async function searchYouTube(q) {
    const sources = [
        // Piped API v1
        {
            name: 'Piped-Kavin',
            url: `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`,
            parse: (d) => (d?.items || []).map(v => ({
                title: v.title,
                url: `https://youtube.com/watch?v=${(v.url || '').split('=')[1]}`,
                videoId: (v.url || '').split('=')[1],
                thumbnail: v.thumbnail,
                duration_seconds: v.duration ? fmtDur(v.duration) : 'N/A',
                channelTitle: v.uploaderName || 'Unknown'
            }))
        },
        // Piped API v2
        {
            name: 'Piped-Adminforge',
            url: `https://pipedapi.adminforge.de/search?q=${encodeURIComponent(q)}&filter=videos`,
            parse: (d) => (d?.items || []).map(v => ({
                title: v.title,
                url: `https://youtube.com/watch?v=${(v.url || '').split('=')[1]}`,
                videoId: (v.url || '').split('=')[1],
                thumbnail: v.thumbnail,
                duration_seconds: v.duration ? fmtDur(v.duration) : 'N/A',
                channelTitle: v.uploaderName || 'Unknown'
            }))
        },
        // yt-search (if installed)
        {
            name: 'yt-search',
            url: null,
            parse: null,
            custom: async () => {
                const yts = require('yt-search');
                const r = await yts(q);
                return (r.videos || []).slice(0, MAX_RESULTS).map(v => ({
                    title: v.title,
                    url: v.url,
                    videoId: v.videoId,
                    thumbnail: v.thumbnail,
                    duration_seconds: v.timestamp || 'N/A',
                    channelTitle: v.author?.name || 'Unknown'
                }));
            }
        }
    ];

    let lastErr = null;
    for (const src of sources) {
        try {
            if (DEBUG) console.log(`[YT] Trying: ${src.name}`);

            let results;
            if (src.custom) {
                results = await src.custom();
            } else {
                const res = await axios.get(src.url, { timeout: 15000 });
                results = src.parse(res.data);
            }

            if (results && results.length > 0) {
                if (DEBUG) console.log(`[YT] ✅ ${src.name}: ${results.length} results`);
                return results.slice(0, MAX_RESULTS);
            }
        } catch (e) {
            lastErr = e;
            if (DEBUG) console.log(`[YT] ❌ ${src.name}: ${e.message}`);
        }
    }
    throw new Error(lastErr?.message || "All sources failed");
}

function fmtDur(sec) {
    sec = Number(sec) || 0;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

// ─────────────── Thumbnail fetch ───────────────
async function imgBuf(url) {
    try {
        const r = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const buf = Buffer.from(r.data);
        return buf.length ? buf : null;
    } catch (e) {
        return null;
    }
}

async function prepMedia(conn, thumbUrl) {
    const buf = await imgBuf(thumbUrl);
    if (!buf) throw new Error('No thumbnail buffer');
    const media = await prepareWAMessageMedia(
        { image: buf },
        { upload: conn.waUploadToServer }
    );
    if (!media.imageMessage) throw new Error('imageMessage not created');
    return media.imageMessage;
}

// ─────────────── Build cards ───────────────
async function buildCarouselCards(conn, videos) {
    const IM = proto.Message.InteractiveMessage;
    const cards = [];

    for (const v of videos) {
        try {
            if (!v.thumbnail) continue;

            const imageMessage = await prepMedia(conn, v.thumbnail);

            // Card body
            const bodyText = `⏱️ ${v.duration_seconds}\n📺 ${v.channelTitle}`;

            const card = createProto(IM, {
                header: createProto(IM.Header, {
                    title: truncate(v.title, 40),
                    hasMediaAttachment: true,
                    imageMessage: imageMessage
                }),
                body: createProto(IM.Body, {
                    text: truncate(bodyText, 60)
                }),
                footer: createProto(IM.Footer, {
                    text: CARD_FOOTER
                }),
                nativeFlowMessage: createProto(IM.NativeFlowMessage, {
                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📥 Download',
                                id: `.yt ${v.url}`
                            })
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🌐 Open',
                                url: v.url,
                                merchant_url: v.url
                            })
                        }
                    ]
                })
            });

            cards.push(card);
        } catch (e) {
            console.error(`[YT] Card skip (${v.title}):`, e.message);
        }
    }
    return cards;
}

// ─────────────── Send Side-Scroll Carousel ───────────────
async function sendSideScrollCarousel(conn, mek, from, query, videos) {
    const IM = proto.Message.InteractiveMessage;
    const CM = IM?.CarouselMessage || proto.Message?.CarouselMessage;

    if (!IM || !CM) throw new Error('CarouselMessage not supported');
    if (typeof conn.relayMessage !== 'function') throw new Error('relayMessage unavailable');

    const cards = await buildCarouselCards(conn, videos);
    if (!cards.length) throw new Error('No cards built');

    // ✅ Main interactive message with carousel
    const interactiveMessage = createProto(IM, {
        header: createProto(IM.Header, {
            title: HDR_TITLE,
            hasMediaAttachment: false
        }),
        body: createProto(IM.Body, {
            text: `🔍 *Search Results*\n_"${query}"_\n\n👈 Swipe to see more 👉`
        }),
        footer: createProto(IM.Footer, {
            text: HDR_FOOTER
        }),
        carouselMessage: createProto(CM, {
            cards: cards,
            messageVersion: 1
        })
    });

    // ✅ Wrap in viewOnceMessage for proper carousel support
    const fullMsg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: interactiveMessage
            }
        }
    }, { quoted: mek });

    await conn.relayMessage(from, fullMsg.message, {
        messageId: fullMsg.key.id
    });
}

// ─────────────── Fallback text ───────────────
async function sendTextFallback(conn, mek, from, query, videos) {
    let text = `🔍 *YouTube: ${query}*\n\n`;
    videos.forEach((v, i) => {
        text += `*${i + 1}.* ${truncate(v.title, 70)}\n`;
        text += `⏱️ ${v.duration_seconds} | 📺 ${v.channelTitle}\n`;
        text += `${v.url}\n\n`;
    });
    text += `_Use \`.yt <url>\` to download_`;
    await conn.sendMessage(from, { text }, { quoted: mek });
}

// ══════════════════════════════════════════════════════════════
//  .yts2 — Side-Scroll YouTube Search Carousel
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'yts2',
    alias: ['ytsearch2', 'ytcarousel', 'ytscroll'],
    react: '🔍',
    category: 'search',
    desc: 'YouTube search → Side-scroll carousel',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    const query = (q || '').trim();
    if (!query) {
        await react(conn, from, mek.key, '❌');
        return reply('❌ *Usage:* `.yts2 <search>`');
    }

    await react(conn, from, mek.key, '🔍');

    try {
        const videos = await searchYouTube(query);
        if (!videos.length) {
            await react(conn, from, mek.key, '❌');
            return reply('❌ No results found.');
        }

        if (DEBUG) console.log(`[YT] Building carousel for ${videos.length} videos...`);

        try {
            await sendSideScrollCarousel(conn, mek, from, query, videos);
            if (DEBUG) console.log('[YT] ✅ Carousel sent');
        } catch (ce) {
            console.error('[YT] Carousel failed:', ce.message);
            await sendTextFallback(conn, mek, from, query, videos);
        }

        await react(conn, from, mek.key, '✅');
    } catch (err) {
        console.error('[YT] Error:', err.message);
        await react(conn, from, mek.key, '❌');
        reply(`❌ Search failed: ${err.message}`);
    }
});
