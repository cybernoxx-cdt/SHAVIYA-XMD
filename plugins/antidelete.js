// ============================================
//   plugins/antidelete.js — SHAVIYA-XMD
//   ✅ Rich Response Tables + Media (NO warning)
//   ✅ LID resolved via findUserId
//   ✅ Media sent PLAIN (no forwarded tag)
// ============================================

'use strict';

const { downloadContentFromMessage } = require('@dnuzi/baileys');
const { getSetting } = require('../lib/settings');

// ── Cache ─────────────────────────────────────────
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
//   LID RESOLUTION
// ══════════════════════════════════════════════════════════
async function resolveSenderJid(rawJid, conn) {
    if (!rawJid) return '';
    if (rawJid.endsWith('@s.whatsapp.net')) return rawJid;

    if (rawJid.endsWith('@lid')) {
        const lidPart = rawJid.split('@')[0];
        const cached = LID_CACHE.get(lidPart);
        if (cached && Date.now() - cached.time < LID_CACHE_TTL) return cached.jid;

        let resolvedJid = '';

        if (typeof conn.findUserId === 'function') {
            try {
                const result = await conn.findUserId(rawJid);
                if (result?.phoneNumber && result.phoneNumber.endsWith('@s.whatsapp.net')) {
                    resolvedJid = result.phoneNumber;
                }
            } catch (e) {}
        }

        if (!resolvedJid && conn.signalRepository?.lidMapping) {
            try {
                const pn = await conn.signalRepository.lidMapping.getPNForLID(rawJid);
                if (pn && pn.endsWith('@s.whatsapp.net')) resolvedJid = pn;
            } catch (e) {}
        }

        if (!resolvedJid) {
            try {
                const contacts = conn.contacts || {};
                for (const c of Object.values(contacts)) {
                    if (!c.id?.endsWith('@s.whatsapp.net')) continue;
                    if (c.lid && c.lid.split('@')[0] === lidPart) {
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

    if (mek.key?.fromMe) return await resolveSenderJid(conn.user?.id || '', conn);

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
//   onMessage — cache
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
//   getMediaInfo — for table
// ══════════════════════════════════════════════════════════
function getMediaInfo(msgContent) {
    if (msgContent.imageMessage) {
        const m = msgContent.imageMessage;
        return { type: 'Image', icon: '📷', size: m.fileLength ? formatBytes(m.fileLength) : 'Unknown',
                 mimetype: m.mimetype || 'image/jpeg', caption: m.caption || '(none)',
                 dims: (m.width && m.height) ? `${m.width}x${m.height}` : 'Unknown' };
    }
    if (msgContent.videoMessage) {
        const m = msgContent.videoMessage;
        return { type: m.ptv ? 'Video (PTV)' : 'Video', icon: '🎥', size: m.fileLength ? formatBytes(m.fileLength) : 'Unknown',
                 mimetype: m.mimetype || 'video/mp4', caption: m.caption || '(none)',
                 dims: (m.width && m.height) ? `${m.width}x${m.height}` : 'Unknown',
                 duration: m.seconds ? `${m.seconds}s` : 'Unknown' };
    }
    if (msgContent.audioMessage) {
        const m = msgContent.audioMessage;
        return { type: m.ptt ? 'Voice Note' : 'Audio', icon: m.ptt ? '🎤' : '🎵',
                 size: m.fileLength ? formatBytes(m.fileLength) : 'Unknown',
                 mimetype: m.mimetype || 'audio/ogg',
                 duration: m.seconds ? `${m.seconds}s` : 'Unknown' };
    }
    if (msgContent.stickerMessage) {
        const m = msgContent.stickerMessage;
        return { type: m.isAnimated ? 'Animated Sticker' : 'Sticker', icon: '🎭',
                 size: m.fileLength ? formatBytes(m.fileLength) : 'Unknown',
                 mimetype: 'image/webp',
                 dims: (m.width && m.height) ? `${m.width}x${m.height}` : 'Unknown' };
    }
    if (msgContent.documentMessage) {
        const m = msgContent.documentMessage;
        return { type: 'Document', icon: '📄', size: m.fileLength ? formatBytes(m.fileLength) : 'Unknown',
                 mimetype: m.mimetype || 'application/octet-stream', caption: m.caption || '(none)',
                 fileName: m.fileName || 'Unknown' };
    }
    if (msgContent.contactMessage) {
        return { type: 'Contact', icon: '👤', name: msgContent.contactMessage.displayName || 'Unknown' };
    }
    if (msgContent.contactsArrayMessage) {
        return { type: 'Contact List', icon: '👥', count: msgContent.contactsArrayMessage.contacts?.length || 0 };
    }
    if (msgContent.locationMessage) {
        const m = msgContent.locationMessage;
        return { type: 'Location', icon: '📍', lat: m.degreesLatitude, lng: m.degreesLongitude,
                 map: `https://maps.google.com/?q=${m.degreesLatitude},${m.degreesLongitude}` };
    }
    if (msgContent.liveLocationMessage) {
        const m = msgContent.liveLocationMessage;
        return { type: 'Live Location', icon: '📡', lat: m.degreesLatitude, lng: m.degreesLongitude,
                 map: `https://maps.google.com/?q=${m.degreesLatitude},${m.degreesLongitude}` };
    }
    if (msgContent.pollCreationMessage) {
        return { type: 'Poll', icon: '📊', question: msgContent.pollCreationMessage.name || 'Unknown' };
    }
    if (msgContent.conversation || msgContent.extendedTextMessage) {
        const txt = msgContent.conversation || msgContent.extendedTextMessage?.text || '(empty)';
        return { type: 'Text', icon: '💬', text: txt };
    }
    return null;
}

function formatBytes(bytes) {
    if (!bytes) return 'Unknown';
    const b = Number(bytes);
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
}

// ══════════════════════════════════════════════════════════
//   buildInfo
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
            mentions.push(`${deleterNumber}@s.whatsapp.net`);
        }
    } else {
        locationValue = fromMe ? 'Sent by Me (Bot)' : 'Private DM';
    }

    return { mentions, senderNumber, deleterNumber, senderDisplay, pushName, locationValue, time, isGroup };
}

// ══════════════════════════════════════════════════════════
//   onDelete — Tables + Media (NO warning)
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
                const info = await buildInfo(conn, cached, update);

                // ═══════════════════════════════════════
                //  Info Table
                // ═══════════════════════════════════════
                const infoRows = [
                    { isHeading: true, items: ['Field', 'Value'] },
                    { isHeading: false, items: ['👤 Name', info.pushName] },
                    { isHeading: false, items: ['📱 Sender', info.senderDisplay] }
                ];

                if (info.isGroup && info.deleterNumber && info.deleterNumber !== info.senderNumber) {
                    infoRows.push({ isHeading: false, items: ['🗑️ Deleted By', `+${info.deleterNumber}`] });
                } else if (info.isGroup && info.deleterNumber === info.senderNumber) {
                    infoRows.push({ isHeading: false, items: ['🗑️ Deleted By', 'Self'] });
                }

                infoRows.push({ isHeading: false, items: [info.isGroup ? '👥 Group' : '💬 Chat', info.locationValue] });
                infoRows.push({ isHeading: false, items: ['🕐 Time', info.time] });

                // ═══════════════════════════════════════
                //  Content Table
                // ═══════════════════════════════════════
                const media = getMediaInfo(msgContent);
                const contentRows = [{ isHeading: true, items: ['Field', 'Value'] }];

                if (media) {
                    contentRows.push({ isHeading: false, items: ['📦 Type', `${media.icon} ${media.type}`] });
                    if (media.size)     contentRows.push({ isHeading: false, items: ['⚖️ Size', media.size] });
                    if (media.mimetype) contentRows.push({ isHeading: false, items: ['🔖 Mime', media.mimetype] });
                    if (media.duration) contentRows.push({ isHeading: false, items: ['⏱️ Duration', media.duration] });
                    if (media.dims)     contentRows.push({ isHeading: false, items: ['📐 Dimensions', media.dims] });
                    if (media.fileName) contentRows.push({ isHeading: false, items: ['📎 File Name', media.fileName] });
                    if (media.caption && media.caption !== '(none)')
                                        contentRows.push({ isHeading: false, items: ['💬 Caption', media.caption] });
                    if (media.text)     contentRows.push({ isHeading: false, items: ['💬 Text', media.text] });
                    if (media.name)     contentRows.push({ isHeading: false, items: ['👤 Name', media.name] });
                    if (media.count)    contentRows.push({ isHeading: false, items: ['👥 Count', String(media.count)] });
                    if (media.question) contentRows.push({ isHeading: false, items: ['❓ Question', media.question] });
                    if (media.map)      contentRows.push({ isHeading: false, items: ['🗺️ Map', media.map] });
                }

                // ═══════════════════════════════════════
                //  Send Tables
                // ═══════════════════════════════════════
                const richResponse = [
                    { text: `## 🚫 ANTI DELETE\n` },
                    { text: `---\n` },
                    { title: '📋 Message Info', table: infoRows },
                    { text: `---\n` },
                    { title: `${media?.icon || '❓'} Message Content`, table: contentRows },
                    { text: `---\n` },
                    { text: `> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮` }
                ];

                try {
                    await conn.sendMessage(ownerJid, {
                        richResponse: richResponse,
                        mentions: info.mentions
                    });
                } catch (e) {
                    console.log('[ANTIDELETE] Rich fail:', e.message);
                }

                // ═══════════════════════════════════════
                //  ✅ Send Media PLAIN (no forwarded, no warning)
                // ═══════════════════════════════════════
                const buffer = await downloadMedia(msgContent);

                if (buffer) {
                    try {
                        // ✅ Image — plain, no context
                        if (msgContent.imageMessage) {
                            await conn.sendMessage(ownerJid, {
                                image: buffer,
                                caption: `📷 *Deleted Image*`
                                // ❌ NO isForwarded
                                // ❌ NO forwardingScore
                                // ❌ NO contextInfo
                            });
                        }
                        // ✅ Video — plain
                        else if (msgContent.videoMessage) {
                            await conn.sendMessage(ownerJid, {
                                video: buffer,
                                caption: `🎥 *Deleted Video*`,
                                mimetype: 'video/mp4'
                            });
                        }
                        // ✅ Audio — plain
                        else if (msgContent.audioMessage) {
                            const isPtt = msgContent.audioMessage.ptt;
                            await conn.sendMessage(ownerJid, {
                                audio: buffer,
                                mimetype: 'audio/ogg; codecs=opus',
                                ptt: isPtt
                            });
                        }
                        // ✅ Sticker — plain
                        else if (msgContent.stickerMessage) {
                            await conn.sendMessage(ownerJid, { sticker: buffer });
                        }
                        // ✅ Document — plain
                        else if (msgContent.documentMessage) {
                            await conn.sendMessage(ownerJid, {
                                document: buffer,
                                mimetype: msgContent.documentMessage.mimetype || 'application/octet-stream',
                                fileName: msgContent.documentMessage.fileName || 'file'
                            });
                        }
                    } catch (e) {
                        console.log('[ANTIDELETE] Media send fail:', e.message);
                    }
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
