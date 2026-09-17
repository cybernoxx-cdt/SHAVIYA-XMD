// ============================================
//   plugins/antidelete.js — SHAVIYA-XMD
// ============================================
//   ✅ LID resolved via findUserId (dnuzi baileys)
//   ✅ Rich Response Tables (no plain text except header)
//   ✅ "ANTI DELETE" header only as text
//   ✅ All details in tables
//   ✅ GROUP: SENDER + DELETED BY separately
//   ✅ All media types handled
//   ✅ Cache size enforced + 2hr cleanup
// ============================================

'use strict';

const { downloadContentFromMessage } = require('@dnuzi/baileys');
const { getSetting } = require('../lib/settings');

// ── Message cache ─────────────────────────────────────────
const msgCache = new Map();
const MAX_CACHE = 2000;
const LID_CACHE = new Map();
const LID_CACHE_TTL = 3_600_000;

setInterval(() => {
    const cutoff = Date.now() - 7_200_000;
    for (const [k, v] of msgCache.entries()) {
        if (v.timestamp < cutoff) msgCache.delete(k);
    }
    const now = Date.now();
    for (const [k, v] of LID_CACHE.entries()) {
        if (now - v.time > LID_CACHE_TTL) LID_CACHE.delete(k);
    }
}, 1_800_000);

// ══════════════════════════════════════════════════════════
//   ✅ LID RESOLUTION — multiple methods
// ══════════════════════════════════════════════════════════
async function resolveSenderJid(rawJid, conn) {
    if (!rawJid) return '';

    if (rawJid.endsWith('@s.whatsapp.net')) return rawJid;

    if (rawJid.endsWith('@lid')) {
        const lidPart = rawJid.split('@')[0];

        const cached = LID_CACHE.get(lidPart);
        if (cached && Date.now() - cached.time < LID_CACHE_TTL) {
            return cached.jid;
        }

        let resolvedJid = '';

        // Method 1: findUserId
        if (typeof conn.findUserId === 'function') {
            try {
                const result = await conn.findUserId(rawJid);
                if (result?.phoneNumber && result.phoneNumber.endsWith('@s.whatsapp.net')) {
                    resolvedJid = result.phoneNumber;
                    console.log(`[ANTIDELETE] ✅ findUserId: ${lidPart} → ${resolvedJid}`);
                }
            } catch (e) {
                console.log('[ANTIDELETE] findUserId failed:', e.message);
            }
        }

        // Method 2: signalRepository
        if (!resolvedJid && conn.signalRepository?.lidMapping) {
            try {
                const pn = await conn.signalRepository.lidMapping.getPNForLID(rawJid);
                if (pn && pn.endsWith('@s.whatsapp.net')) {
                    resolvedJid = pn;
                    console.log(`[ANTIDELETE] ✅ signalRepo: ${lidPart} → ${resolvedJid}`);
                }
            } catch (e) {}
        }

        // Method 3: Contacts map
        if (!resolvedJid) {
            try {
                const contacts = conn.contacts || {};
                for (const c of Object.values(contacts)) {
                    if (!c.id?.endsWith('@s.whatsapp.net')) continue;
                    if (c.lid && c.lid.split('@')[0] === lidPart) {
                        resolvedJid = c.id;
                        console.log(`[ANTIDELETE] ✅ contacts: ${lidPart} → ${resolvedJid}`);
                        break;
                    }
                }
            } catch (e) {}
        }

        // Method 4: store
        if (!resolvedJid && global.store?.contacts) {
            try {
                for (const c of Object.values(global.store.contacts)) {
                    if (c.lid?.split('@')[0] === lidPart && c.id?.endsWith('@s.whatsapp.net')) {
                        resolvedJid = c.id;
                        break;
                    }
                }
            } catch (e) {}
        }

        if (resolvedJid) {
            LID_CACHE.set(lidPart, { jid: resolvedJid, time: Date.now() });
            return resolvedJid;
        }

        console.log(`[ANTIDELETE] ❌ Could not resolve LID: ${lidPart}`);
        return rawJid;
    }

    return rawJid;
}

function extractNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
}

async function resolveSender(mek, conn) {
    const chat    = mek.key?.remoteJid || '';
    const isGroup = chat.endsWith('@g.us');

    if (mek.key?.fromMe) {
        return await resolveSenderJid(conn.user?.id || '', conn);
    }

    if (isGroup) {
        const raw = mek.key?.participant || mek.participant || '';
        if (!raw || raw === chat) return '';
        return await resolveSenderJid(raw, conn);
    }

    return await resolveSenderJid(chat, conn);
}

// ── Download media ────────
async function downloadMedia(msgContent) {
    let mediaType, mediaMsg;
    if      (msgContent.imageMessage)    { mediaType = 'image';    mediaMsg = msgContent.imageMessage; }
    else if (msgContent.videoMessage)    { mediaType = 'video';    mediaMsg = msgContent.videoMessage; }
    else if (msgContent.audioMessage)    { mediaType = 'audio';    mediaMsg = msgContent.audioMessage; }
    else if (msgContent.stickerMessage)  { mediaType = 'sticker';  mediaMsg = msgContent.stickerMessage; }
    else if (msgContent.documentMessage) { mediaType = 'document'; mediaMsg = msgContent.documentMessage; }
    else return null;

    try {
        const stream = await downloadContentFromMessage(mediaMsg, mediaType);
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    } catch (e) {
        console.log(`[ANTIDELETE] Media fail (${mediaType}):`, e.message);
        return null;
    }
}

// ══════════════════════════════════════════════════════════
//   DEEP UNWRAP
// ══════════════════════════════════════════════════════════
function unwrapMessage(msg) {
    if (!msg) return null;
    let cur = msg;
    let depth = 0;

    while (cur && depth < 6) {
        depth++;
        if (cur.ephemeralMessage?.message) { cur = cur.ephemeralMessage.message; continue; }
        if (cur.viewOnceMessage?.message) { cur = cur.viewOnceMessage.message; continue; }
        if (cur.viewOnceMessageV2?.message) { cur = cur.viewOnceMessageV2.message; continue; }
        if (cur.viewOnceMessageV2Extension?.message) { cur = cur.viewOnceMessageV2Extension.message; continue; }
        if (cur.deviceSentMessage?.message) { cur = cur.deviceSentMessage.message; continue; }
        if (cur.documentWithCaptionMessage?.message) { cur = cur.documentWithCaptionMessage.message; continue; }
        break;
    }

    return cur;
}

// ══════════════════════════════════════════════════════════
//   onMessage — cache every message
// ══════════════════════════════════════════════════════════
async function onMessage(conn, mek, sessionId) {
    try {
        if (!mek?.message) return;

        const msgContent = unwrapMessage(mek.message);
        if (!msgContent) return;

        const keys = Object.keys(msgContent);
        if (
            keys.includes('protocolMessage') ||
            keys.includes('senderKeyDistributionMessage') ||
            (keys.length === 1 && keys[0] === 'messageContextInfo')
        ) return;

        const id      = mek.key.id;
        const chat    = mek.key.remoteJid;
        const isGroup = chat?.endsWith('@g.us');

        let senderJid;
        if (mek._resolvedSender) {
            senderJid = mek._resolvedSender;
        } else {
            senderJid = await resolveSender(mek, conn);
        }
        const senderNumber = extractNumber(senderJid);
        const pushName     = mek.pushName || (mek.key.fromMe ? 'Me' : senderNumber) || 'Unknown';

        msgCache.set(id, {
            msgContent,
            chat,
            senderJid,
            senderNumber,
            pushName,
            isGroup,
            fromMe: mek.key.fromMe || false,
            timestamp: Date.now(),
            sessionId,
        });

        if (msgCache.size > MAX_CACHE) {
            msgCache.delete(msgCache.keys().next().value);
        }

    } catch (e) {
        console.log('[ANTIDELETE onMessage]:', e.message);
    }
}

// ══════════════════════════════════════════════════════════
//   buildInfo — ANTI DELETE header + Info Table
// ══════════════════════════════════════════════════════════
async function buildInfo(conn, cached, update) {
    const { senderNumber, pushName, chat, isGroup, fromMe } = cached;

    const senderMentionJid  = senderNumber ? `${senderNumber}@s.whatsapp.net` : null;
    const senderDisplay     = senderNumber ? `+${senderNumber}` : 'Unknown';

    const time = new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Colombo',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
    });

    let locationValue;
    let mentions = senderMentionJid ? [senderMentionJid] : [];
    let deleterNumber = '';

    if (isGroup) {
        let groupName = '';
        try {
            const meta = await conn.groupMetadata(chat);
            groupName  = meta.subject;
        } catch {
            groupName = chat.split('@')[0];
        }
        locationValue = groupName;

        const rawDeleterJid  = update?.key?.participant || '';
        const deleterJid     = (rawDeleterJid && !rawDeleterJid.endsWith('@g.us'))
            ? await resolveSenderJid(rawDeleterJid, conn)
            : '';
        deleterNumber  = extractNumber(deleterJid);

        if (deleterNumber && deleterNumber !== senderNumber) {
            const deleterMentionJid = `${deleterNumber}@s.whatsapp.net`;
            mentions.push(deleterMentionJid);
        }
    } else {
        locationValue = fromMe ? 'Sent by Me (Bot)' : 'Private DM';
    }

    // ─── Info Table ───
    const infoRows = [
        { isHeading: true, items: ['Field', 'Value'] },
        { isHeading: false, items: ['👤 Name', pushName] },
        { isHeading: false, items: ['📱 Sender', senderDisplay] }
    ];

    if (isGroup && deleterNumber && deleterNumber !== senderNumber) {
        infoRows.push({ isHeading: false, items: ['🗑️ Deleted By', `+${deleterNumber}`] });
    } else if (isGroup && deleterNumber === senderNumber) {
        infoRows.push({ isHeading: false, items: ['🗑️ Deleted By', 'Self'] });
    }

    infoRows.push({ isHeading: false, items: [isGroup ? '👥 Group' : '💬 Chat', locationValue] });
    infoRows.push({ isHeading: false, items: ['🕐 Time', time] });

    // ─── Rich Response ───
    const richResponse = [
        { text: `## 🚫 ANTI DELETE\n` },
        { text: `---\n` },
        {
            title: '📋 Message Info',
            table: infoRows
        }
    ];

    return { richResponse, mentions, senderNumber, deleterNumber };
}

// ══════════════════════════════════════════════════════════
//   onDelete — Tables only
// ══════════════════════════════════════════════════════════
async function onDelete(conn, updates, sessionId) {
    try {
        if (!getSetting('antidelete', sessionId)) return;

        const rawOwner = conn.user?.id?.split(':')[0]?.split('@')[0];
        if (!rawOwner) return;
        const ownerJid = `${rawOwner}@s.whatsapp.net`;

        for (const update of updates) {
            try {
                const updateMsg = update.update?.message;
                const proto = updateMsg?.protocolMessage;
                const isProtocolRevoke = proto?.type === 0 || proto?.type === 'REVOKE';
                const isNullRevoke  = update.update?.message === null;
                const isStubRevoke  = update.update?.messageStubType === 1;

                if (!isProtocolRevoke && !isNullRevoke && !isStubRevoke) continue;

                let deletedId;
                if (isProtocolRevoke) deletedId = proto?.key?.id;
                else deletedId = update.key?.id;

                if (!deletedId) continue;

                const cached = msgCache.get(deletedId);
                if (!cached) continue;
                if (cached.fromMe) continue;

                const deleterRaw = update?.key?.participant || update?.key?.remoteJid || '';
                const deleterNum = deleterRaw.split('@')[0].split(':')[0].replace(/\D/g, '');
                if (deleterNum && deleterNum === rawOwner) continue;

                const { msgContent } = cached;
                const { richResponse, mentions } = await buildInfo(conn, cached, update);

                // ─── Helper: send rich response with content table ───
                const sendRichTable = async (titleText, tableRows) => {
                    const rich = [...richResponse];

                    rich.push({ text: `---\n` });
                    rich.push({
                        title: titleText,
                        table: tableRows
                    });

                    rich.push({ text: `---\n` });
                    rich.push({ text: `> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮` });

                    try {
                        await conn.sendMessage(ownerJid, { richResponse: rich });
                    } catch (e) {
                        // Fallback to text if rich response fails
                        console.log('[ANTIDELETE] Rich response fail, fallback:', e.message);
                        const fallbackText =
                            `🚫 *ANTI DELETE*\n\n` +
                            `📋 *Message Info*\n` +
                            infoRowsText(rich[2].table) +
                            `\n\n${titleText}\n` +
                            infoRowsText(tableRows) +
                            `\n\n> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮`;
                        await conn.sendMessage(ownerJid, { text: fallbackText, mentions });
                    }
                };

                // Helper for fallback text
                const infoRowsText = (rows) => {
                    let out = '';
                    for (const r of rows) {
                        if (r.isHeading) continue;
                        out += `*${r.items[0]}:* ${r.items[1]}\n`;
                    }
                    return out;
                };

                // ═══════════════════════════════════════════
                //  TEXT
                // ═══════════════════════════════════════════
                if (msgContent.conversation || msgContent.extendedTextMessage) {
                    const txt =
                        msgContent.conversation ||
                        msgContent.extendedTextMessage?.text || '(empty)';

                    await sendRichTable('💬 Text Content', [
                        { isHeading: true, items: ['Content'] },
                        { isHeading: false, items: [txt] }
                    ]);
                }

                // ═══════════════════════════════════════════
                //  IMAGE
                // ═══════════════════════════════════════════
                else if (msgContent.imageMessage) {
                    const caption = msgContent.imageMessage.caption || '(none)';
                    const buffer  = await downloadMedia(msgContent);

                    await sendRichTable('📷 Image Deleted', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['📷 Type', 'Image'] },
                        { isHeading: false, items: ['💬 Caption', caption] }
                    ]);

                    if (buffer) {
                        await conn.sendMessage(ownerJid, { image: buffer, mentions });
                    }
                }

                // ═══════════════════════════════════════════
                //  VIDEO
                // ═══════════════════════════════════════════
                else if (msgContent.videoMessage) {
                    const caption = msgContent.videoMessage.caption || '(none)';
                    const buffer  = await downloadMedia(msgContent);

                    await sendRichTable('🎥 Video Deleted', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['🎥 Type', 'Video'] },
                        { isHeading: false, items: ['💬 Caption', caption] }
                    ]);

                    if (buffer) {
                        await conn.sendMessage(ownerJid, { video: buffer, mentions });
                    }
                }

                // ═══════════════════════════════════════════
                //  AUDIO / VOICE
                // ═══════════════════════════════════════════
                else if (msgContent.audioMessage) {
                    const isPtt  = msgContent.audioMessage.ptt;
                    const buffer = await downloadMedia(msgContent);

                    await sendRichTable(isPtt ? '🎤 Voice Note Deleted' : '🎵 Audio Deleted', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['🎵 Type', isPtt ? 'Voice Note' : 'Audio'] }
                    ]);

                    if (buffer) {
                        await conn.sendMessage(ownerJid, {
                            audio:    buffer,
                            mimetype: 'audio/ogg; codecs=opus',
                            ptt:      isPtt,
                        });
                    }
                }

                // ═══════════════════════════════════════════
                //  STICKER
                // ═══════════════════════════════════════════
                else if (msgContent.stickerMessage) {
                    const buffer = await downloadMedia(msgContent);

                    await sendRichTable('🎭 Sticker Deleted', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['🎭 Type', 'Sticker'] }
                    ]);

                    if (buffer) {
                        await conn.sendMessage(ownerJid, { sticker: buffer });
                    }
                }

                // ═══════════════════════════════════════════
                //  DOCUMENT
                // ═══════════════════════════════════════════
                else if (msgContent.documentMessage) {
                    const fname    = msgContent.documentMessage.fileName || 'Unknown';
                    const mimetype = msgContent.documentMessage.mimetype || 'application/octet-stream';
                    const buffer   = await downloadMedia(msgContent);

                    await sendRichTable('📄 Document Deleted', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['📄 Type', 'Document'] },
                        { isHeading: false, items: ['📎 File', fname] },
                        { isHeading: false, items: ['🔖 Mime', mimetype] }
                    ]);

                    if (buffer) {
                        await conn.sendMessage(ownerJid, {
                            document: buffer,
                            mimetype,
                            fileName: fname,
                            mentions,
                        });
                    }
                }

                // ═══════════════════════════════════════════
                //  CONTACT
                // ═══════════════════════════════════════════
                else if (msgContent.contactMessage) {
                    const cname = msgContent.contactMessage.displayName || 'Unknown';
                    await sendRichTable('👤 Contact Deleted', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['👤 Name', cname] }
                    ]);
                }

                // ═══════════════════════════════════════════
                //  CONTACT LIST
                // ═══════════════════════════════════════════
                else if (msgContent.contactsArrayMessage) {
                    const count = msgContent.contactsArrayMessage.contacts?.length || 0;
                    await sendRichTable('👥 Contact List Deleted', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['👥 Count', String(count)] }
                    ]);
                }

                // ═══════════════════════════════════════════
                //  LOCATION
                // ═══════════════════════════════════════════
                else if (msgContent.locationMessage) {
                    const lat = msgContent.locationMessage.degreesLatitude;
                    const lng = msgContent.locationMessage.degreesLongitude;
                    await sendRichTable('📍 Location Deleted', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['📍 Latitude', String(lat)] },
                        { isHeading: false, items: ['📍 Longitude', String(lng)] },
                        { isHeading: false, items: ['🗺️ Map', `https://maps.google.com/?q=${lat},${lng}`] }
                    ]);
                }

                // ═══════════════════════════════════════════
                //  LIVE LOCATION
                // ═══════════════════════════════════════════
                else if (msgContent.liveLocationMessage) {
                    const lat = msgContent.liveLocationMessage.degreesLatitude;
                    const lng = msgContent.liveLocationMessage.degreesLongitude;
                    await sendRichTable('📡 Live Location Deleted', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['📍 Latitude', String(lat)] },
                        { isHeading: false, items: ['📍 Longitude', String(lng)] },
                        { isHeading: false, items: ['🗺️ Map', `https://maps.google.com/?q=${lat},${lng}`] }
                    ]);
                }

                // ═══════════════════════════════════════════
                //  POLL
                // ═══════════════════════════════════════════
                else if (msgContent.pollCreationMessage) {
                    const question = msgContent.pollCreationMessage.name || 'Unknown';
                    await sendRichTable('📊 Poll Deleted', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['📊 Type', 'Poll'] },
                        { isHeading: false, items: ['❓ Question', question] }
                    ]);
                }

                // ═══════════════════════════════════════════
                //  UNKNOWN
                // ═══════════════════════════════════════════
                else {
                    const msgType = Object.keys(msgContent)[0] || 'unknown';
                    await sendRichTable('❓ Unknown Message', [
                        { isHeading: true, items: ['Field', 'Value'] },
                        { isHeading: false, items: ['📦 Type', msgType] }
                    ]);
                }

                msgCache.delete(deletedId);

            } catch (innerErr) {
                console.log('[ANTIDELETE inner]:', innerErr.message);
            }
        }
    } catch (e) {
        console.log('[ANTIDELETE onDelete]:', e.message);
    }
}

module.exports = { onMessage, onDelete };
