const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════
//  BOT INFO — SHAVIYA-XMD
//  Clean bot info card (no movanest.xyz link)
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const OWNER_NAME = 'Savendra Dampriya';
const OWNER_NUMBER = '94707085822';
const BOT_NAME = 'SHAVIYA-XMD';
const VERSION = 'V4.0';
const REPO_URL = 'https://github.com/cybernoxx-cdt/SHAVIYA-XMD';

// ⭐ LOGO URL
const LOGO_URL = 'https://raw.githubusercontent.com/cybernoxx-cdt/SHAVIYA-FILE-S/main/fbccbdd74f546a39619d2bbeaccf6071.0000000.jpg';

// 🎬 VIDEO URL
const VIDEO_URL = 'https://raw.githubusercontent.com/cybernoxx-cdt/SHAVIYA-FILE-S/main/ssstik.io_@ranuviii_1785419859619.mp4';

cmd({
    pattern: 'info',
    alias: ['botinfo', 'aboutme', 'bot'],
    desc: 'Show bot information',
    category: 'main',
    react: '🤖',
    filename: __filename
},
async (conn, mek, m, { from, reply, pushname }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🤖', key: mek.key } });

        // Uptime
        const uptimeSec = process.uptime();
        const days = Math.floor(uptimeSec / 86400);
        const hours = Math.floor((uptimeSec % 86400) / 3600);
        const minutes = Math.floor((uptimeSec % 3600) / 60);
        const seconds = Math.floor(uptimeSec % 60);
        const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // Memory
        const memUsed = (process.memoryUsage().rss / 1048576).toFixed(2);
        const memTotal = (os.totalmem() / 1048576).toFixed(0);

        // CPU
        const cpuCores = os.cpus().length;

        // Platform
        const platform = os.platform();
        const arch = os.arch();

        // Bot number
        const botNumber = conn.user?.id?.split(':')[0] || 'Unknown';

        // Time
        const now = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit', minute: '2-digit', hour12: true,
            day: '2-digit', month: 'short', year: 'numeric'
        });

        // Plugin count
        let pluginCount = 0;
        try {
            pluginCount = fs.readdirSync(__dirname).filter(f => f.endsWith('.js')).length;
        } catch (e) {}

        // Command count
        let cmdCount = 0;
        try {
            cmdCount = require('../command').commands.length;
        } catch (e) {}

        // ─── Thumbnail ───
        let thumbBuffer = null;
        if (LOGO_URL && /^https?:\/\//.test(LOGO_URL)) {
            try {
                const res = await axios.get(LOGO_URL, {
                    responseType: 'arraybuffer',
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const buf = Buffer.from(res.data);
                if (buf.length > 0 && buf.length <= 500 * 1024) {
                    thumbBuffer = buf;
                }
            } catch (e) {
                console.log('[BOTINFO] Thumb fail:', e.message);
            }
        }

        // ═══════════════════════════════════════════════
        //  INFO TEXT
        // ═══════════════════════════════════════════════
        const infoText =
            `╔══════════════════════╗\n` +
            `║   🌟 *${BOT_NAME}*   ║\n` +
            `╚══════════════════════╝\n\n` +
            `👤 *User:* ${pushname || 'User'}\n` +
            `🤖 *Bot:* +${botNumber}\n` +
            `📦 *Version:* ${VERSION}\n` +
            `⚡ *Prefix:* .\n` +
            `🌐 *Mode:* Public\n\n` +
            `╭─── [ 📊 *STATISTICS* ] ───\n` +
            `│ 📁 *Plugins:* ${pluginCount}\n` +
            `│ 🎯 *Commands:* ${cmdCount}\n` +
            `│ ⏱️ *Uptime:* ${uptimeStr}\n` +
            `│ 💾 *Memory:* ${memUsed} / ${memTotal} MB\n` +
            `│ 💻 *CPU:* ${cpuCores} cores\n` +
            `│ 🖥️ *Platform:* ${platform} ${arch}\n` +
            `╰──────────────────\n\n` +
            `╭─── [ 👑 *OWNER* ] ───\n` +
            `│ 👤 *Name:* ${OWNER_NAME}\n` +
            `│ 📱 *Number:* +${OWNER_NUMBER}\n` +
            `│ 🌐 *Repo:* GitHub\n` +
            `╰──────────────────\n\n` +
            `⏰ *Time:* ${now}\n\n` +
            `> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮`;

        // ═══════════════════════════════════════════════
        //  ✅ External Ad Reply (NO sourceUrl = no movanest.xyz)
        // ═══════════════════════════════════════════════
        const adReply = {
            title: `🌟 ${BOT_NAME} ${VERSION}`,
            body: `⚡ Advanced WhatsApp Bot · ${cmdCount} commands`,
            thumbnail: thumbBuffer,
            mediaType: 1,   // 1 = image (safer)
            showAdAttribution: false,
            renderLargerThumbnail: false
            // ❌ NO sourceUrl → no movanest.xyz URL shown
            // ❌ NO mediaUrl → no video (if causing issues)
        };

        await conn.sendMessage(from, {
            text: infoText,
            externalAdReply: adReply
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[BOTINFO]', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ Error: ${err.message}`);
    }
});
