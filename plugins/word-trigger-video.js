// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   plugins/word-trigger-video.js — SHAVIYA-XMD
//   🎥 Word Trigger Video Note (PTV circle) Plugin — Always ON
//   ✅ GitHub raw .mp4 → arraybuffer download + size validation
//   (Mirrors word-trigger-voice.js, but sends a ptv video note
//    instead of a ptt voice note — same style as plugins/alive.js)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'use strict';

const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const { cmd } = require('../command');

// ── Data file ────────────────────────────────────────────────
const VIDEO_FILE = path.join(__dirname, '../shaviya_data/triggervideo.json');

function loadTriggers() {
    try {
        if (!fs.existsSync(VIDEO_FILE)) return {};
        return JSON.parse(fs.readFileSync(VIDEO_FILE, 'utf8'));
    } catch (_) { return {}; }
}

// ── Convert GitHub blob URL → raw.githubusercontent.com ──────
function toDirectUrl(url) {
    if (url.includes('github.com') && url.includes('/blob/')) {
        return url
            .replace('github.com', 'raw.githubusercontent.com')
            .replace('/blob/', '/');
    }
    return url;
}

// ── Download mp4 buffer with validation ──────────────────────
async function downloadMp4(url) {
    const directUrl = toDirectUrl(url);

    const res = await axios.get(directUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*',
            'Cache-Control': 'no-cache'
        }
    });

    const buf = Buffer.from(res.data);

    if (buf.length < 1000) {
        throw new Error(`Downloaded file too small (${buf.length} bytes) — not valid mp4`);
    }

    // MP4 files carry an "ftyp" box a few bytes into the header
    const header = buf.slice(4, 12).toString('ascii');
    if (!header.includes('ftyp')) {
        console.warn(`[TRIGGERVIDEO] ⚠️ Header "${header}" — may not be valid MP4. Sending anyway.`);
    }

    return buf;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  on:body — every message check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cmd({ on: 'body', dontAddCommandList: true },
async (conn, mek, m, { from, body }) => {
    try {
        if (!body || !body.trim()) return;

        const bodyLower = body.trim().toLowerCase();
        const triggers  = loadTriggers();
        if (Object.keys(triggers).length === 0) return;

        // ── Word match ───────────────────────────────────────
        let matchedUrl = null;
        for (const word in triggers) {
            if (bodyLower === word.trim().toLowerCase()) {
                matchedUrl = triggers[word];
                break;
            }
        }
        if (!matchedUrl) return;

        // ── Check if this is a reply ─────────────────────────
        const contextInfo = mek.message?.extendedTextMessage?.contextInfo
                         || mek.message?.imageMessage?.contextInfo
                         || mek.message?.videoMessage?.contextInfo
                         || null;

        const isReply      = !!(contextInfo?.stanzaId);
        const quotedMsgId  = contextInfo?.stanzaId;
        const quotedSender = contextInfo?.participant || contextInfo?.remoteJid || from;

        // ── STEP 1: Delete trigger message ───────────────────
        try {
            await conn.sendMessage(from, { delete: mek.key });
        } catch (_) {}

        // ── STEP 2: Download mp4 ──────────────────────────────
        let videoBuf;
        try {
            videoBuf = await downloadMp4(matchedUrl);
            console.log(`[TRIGGERVIDEO] ✅ Downloaded ${(videoBuf.length / 1024).toFixed(1)}KB for: "${bodyLower}"`);
        } catch (dlErr) {
            console.error(`[TRIGGERVIDEO] ❌ Download failed for "${bodyLower}":`, dlErr.message);
            return;
        }

        // ── STEP 3: Send video note (ptv circle) ─────────────
        await conn.sendPresenceUpdate('recording', from);

        const videoPayload = {
            video:       videoBuf,
            mimetype:    'video/mp4',
            ptv:         true,
            gifPlayback: false
        };

        if (isReply && quotedMsgId) {
            await conn.sendMessage(from, videoPayload, {
                quoted: {
                    key: {
                        remoteJid:   from,
                        id:          quotedMsgId,
                        participant: quotedSender,
                        fromMe:      false
                    },
                    message: {}
                }
            });
            console.log(`[TRIGGERVIDEO] ✅ Reply-video-note sent for: "${bodyLower}"`);
        } else {
            await conn.sendMessage(from, videoPayload);
            console.log(`[TRIGGERVIDEO] ✅ Video note sent for: "${bodyLower}"`);
        }

    } catch (e) {
        console.log('[TRIGGERVIDEO] Error:', e.message);
    }
});
