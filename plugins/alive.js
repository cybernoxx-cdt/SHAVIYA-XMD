// ============================================================
//  alive.js — SHAVIYA-XMD
//  © Mr Savendra
// ============================================================

const config = require('../config');
const { cmd } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const VIDEO_NOTE_URL = 'https://github.com/cybernoxx-cdt/SHAVIYA-FILE-S/raw/refs/heads/main/ssstik.io_1788797627470.mp4';
const VOICE_NOTE_URL = 'https://github.com/cybernoxx-cdt/SHAVIYA-FILE-S/raw/refs/heads/main/Sabi,%20MIA%20BOYKA%20-%20%D0%91%D0%B0%D0%B7%D0%BE%D0%B2%D1%8B%D0%B9%20%D0%BC%D0%B8%D0%BD%D0%B8%D0%BC%D1%83%D0%BC%20(Bare%20minimum)%20-%20MUSIC%20CHART%20(128k).mp3';

const FakeVCard = {
    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: {
        contactMessage: {
            displayName: '© Mr Savendra',
            vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:SHAVIYA-XMD\nORG:© Mr Savendra;\nTEL;type=CELL;type=VOICE;waid=94707085822:+94707085822\nEND:VCARD'
        }
    }
};

cmd({
    pattern:  'alive',
    alias:    ['hyshavi', 'shavi', 'a'],
    react:    '🌝',
    desc:     'Check bot online status',
    category: 'main',
    filename: __filename
},
async (conn, mek, m, { from, pushname, sender, reply }) => {
    try {
        await conn.sendPresenceUpdate('recording', from);

        const date   = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
        const time   = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' });
        const ram    = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const ramMax = (os.totalmem() / 1024 / 1024).toFixed(0);

        const caption =
`*╭─「 🌝 SHAVIYA-XMD — ALIVE STATUS 」─╮*

*│ 👋 HELLO   :* ${pushname}
*│ 📅 DATE    :* ${date}
*│ 🕐 TIME    :* ${time}
*│ ─────────────────────────*
*│ 🤖 BOT     :* SHAVIYA-XMD
*│ 👤 OWNER   :* Savendra Dampriya
*│ ⏱️ UPTIME  :* ${runtime(process.uptime())}
*│ 💾 RAM     :* ${ram}MB / ${ramMax}MB
*│ 🔑 PREFIX  :* [ ${config.PREFIX || '.'} ]
*│ 🌐 MODE    :* ${(config.MODE || 'public').toUpperCase()}
*│ 🌀 VERSION :* ${config.BOT_VERSION || 'Beta Version'}
*│ ─────────────────────────*
*│ ☘️ MENU    :* .menu
*│ ⚡ SPEED   :* .ping*
*╰────────────────────────╯*

> 💎 ᴘᴏᴡᴇʀᴇᴅ ʙʏ *SHAVIYA-XMD*`;

        // ── 1. Image + caption ──
        try {
            await conn.sendMessage(from, {
                image: { url: 'https://whiteshadow-uploder.zone.id/files/cabf.png' },
                caption,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '@newsletter',
                        newsletterName: '© Mr Savendra',
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });
        } catch (_) {
            await reply(caption);
        }

        // ── 2. Video Note (ptv circle) ──
        try {
            console.log('[ALIVE] Sending video note...');
            await conn.sendMessage(from, {
                video:       { url: VIDEO_NOTE_URL },
                mimetype:    'video/mp4',
                ptv:         true,
                gifPlayback: false
            }, { quoted: FakeVCard });
            console.log('[ALIVE] Video note sent ✅');
        } catch (e1) {
            console.error('[ALIVE] Video note error:', e1.message);
        }

        // ── 3. Voice Note (ptt) ──
        let tmpIn, tmpOut;
        try {
            await conn.sendPresenceUpdate('recording', from);
            console.log('[ALIVE] Downloading voice note source...');
            const https = require('https');
            const audioBuffer = await new Promise((resolve, reject) => {
                const fetchUrl = (url, redirects = 5) => {
                    if (redirects === 0) return reject(new Error('Too many redirects'));
                    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
                        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                            return fetchUrl(res.headers.location, redirects - 1);
                        }
                        const chunks = [];
                        res.on('data', chunk => chunks.push(chunk));
                        res.on('end', () => resolve(Buffer.concat(chunks)));
                        res.on('error', reject);
                    }).on('error', reject);
                };
                fetchUrl(VOICE_NOTE_URL);
            });

            // Write the downloaded (mp3) bytes to a temp file, then transcode
            // to a real OGG/Opus stream — WhatsApp's ptt player refuses audio
            // whose container/codec doesn't actually match the mimetype tag.
            tmpIn  = path.join(os.tmpdir(), `alive_in_${Date.now()}.mp3`);
            tmpOut = path.join(os.tmpdir(), `alive_out_${Date.now()}.ogg`);
            fs.writeFileSync(tmpIn, audioBuffer);

            console.log('[ALIVE] Converting to ogg/opus...');
            await new Promise((resolve, reject) => {
                ffmpeg(tmpIn)
                    .audioCodec('libopus')
                    .audioBitrate('32k')
                    .audioChannels(1)
                    .audioFrequency(48000)
                    .format('ogg')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(tmpOut);
            });

            console.log('[ALIVE] Sending voice note...');
            await conn.sendMessage(from, {
                audio:    fs.readFileSync(tmpOut),
                mimetype: 'audio/ogg; codecs=opus',
                ptt:      true
            }, { quoted: FakeVCard });
            console.log('[ALIVE] Voice note sent ✅');
        } catch (e2) {
            console.error('[ALIVE] Voice note error:', e2.message);
        } finally {
            // Clean up temp files regardless of success/failure
            try { if (tmpIn && fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn); } catch (_) {}
            try { if (tmpOut && fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut); } catch (_) {}
        }

        await conn.sendPresenceUpdate('available', from);

    } catch (e) {
        console.error('[ALIVE ERROR]', e);
        reply('⚠️ Error: ' + e.message);
    }
});
