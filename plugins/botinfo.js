const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════
//  BOT INFO — SHAVIYA-XMD
//  Rich Response Style (code blocks, tables, inline links)
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const OWNER_NAME = 'Savendra Dampriya';
const OWNER_NUMBER = '94707085822';
const BOT_NAME = 'SHAVIYA-XMD';
const VERSION = 'V4.0';
const REPO_URL = 'https://github.com/cybernoxx-cdt/SHAVIYA-XMD';
const LOGO_URL = 'https://raw.githubusercontent.com/cybernoxx-cdt/SHAVIYA-FILE-S/main/fbccbdd74f546a39619d2bbeaccf6071.0000000.jpg';

cmd({
    pattern: 'info',
    alias: ['botinfo', 'aboutme', 'bot'],
    desc: 'Show bot information (Rich Response)',
    category: 'main',
    react: '🤖',
    filename: __filename
},
async (conn, mek, m, { from, reply, pushname }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🤖', key: mek.key } });

        // ─── Stats ───
        const uptimeSec = process.uptime();
        const days = Math.floor(uptimeSec / 86400);
        const hours = Math.floor((uptimeSec % 86400) / 3600);
        const minutes = Math.floor((uptimeSec % 3600) / 60);
        const seconds = Math.floor(uptimeSec % 60);
        const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const memUsed = (process.memoryUsage().rss / 1048576).toFixed(0);
        const memTotal = (os.totalmem() / 1048576).toFixed(0);
        const cpuCores = os.cpus().length;
        const platform = os.platform();
        const arch = os.arch();
        const botNumber = conn.user?.id?.split(':')[0] || 'Unknown';

        const now = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit', minute: '2-digit', hour12: true,
            day: '2-digit', month: 'short', year: 'numeric'
        });

        let pluginCount = 0;
        try {
            pluginCount = fs.readdirSync(__dirname).filter(f => f.endsWith('.js')).length;
        } catch (e) {}

        let cmdCount = 0;
        try {
            cmdCount = require('../command').commands.length;
        } catch (e) {}

        // ═══════════════════════════════════════════════
        //  ✅ RICH RESPONSE — Dnuzi baileys style
        // ═══════════════════════════════════════════════
        await conn.sendMessage(from, {
            richResponse: [
                // ── Header ──
                {
                    text: `## 🌟 ${BOT_NAME} ${VERSION}\n`
                },
                {
                    text: `⚡ *Advanced WhatsApp Bot*\n---\n`
                },

                // ── User Info ──
                {
                    text: `### 👤 User Information\n`
                },
                {
                    text: `**Name:** ${pushname || 'User'}\n**Bot:** +${botNumber}\n**Prefix:** .\n**Mode:** Public\n---\n`
                },

                // ── Statistics Table ──
                {
                    text: `### 📊 Statistics\n`
                },
                {
                    title: 'Bot Statistics',
                    table: [
                        { isHeading: true, items: ['Metric', 'Value'] },
                        { isHeading: false, items: ['📁 Plugins', String(pluginCount)] },
                        { isHeading: false, items: ['🎯 Commands', String(cmdCount)] },
                        { isHeading: false, items: ['⏱️ Uptime', uptimeStr] },
                        { isHeading: false, items: ['💾 Memory', `${memUsed} / ${memTotal} MB`] },
                        { isHeading: false, items: ['💻 CPU', `${cpuCores} cores`] },
                        { isHeading: false, items: ['🖥️ Platform', `${platform} ${arch}`] }
                    ]
                },
                { text: `---\n` },

                // ── Owner Info ──
                {
                    text: `### 👑 Owner Information\n`
                },
                {
                    text: `**Name:** ${OWNER_NAME}\n**Number:** +${OWNER_NUMBER}\n---\n`
                },

                // ── Links ──
                {
                    text: `### 🔗 Links\n`
                },
                {
                    text: `---\n`,
                    links: [
                        {
                            text: '1. GitHub Repository',
                            title: 'Source Code',
                            url: REPO_URL
                        },
                        {
                            text: '2. WhatsApp Support',
                            title: 'Contact Owner',
                            url: `https://wa.me/${OWNER_NUMBER}`
                        }
                    ]
                },
                { text: `---\n` },

                // ── Time ──
                {
                    text: `⏰ *Time:* ${now}\n\n`
                },
                {
                    text: `> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮`
                }
            ]
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[BOTINFO] Error:', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ Error: ${err.message}`);
    }
});
