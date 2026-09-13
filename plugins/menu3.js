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

const FOOTER = '👑 SHAVIYA-XMD 👑';
const CREDIT = '> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮';

// ══════════════════════════════════════════════════════════════
//  MENU DATA — Grouped categories
// ══════════════════════════════════════════════════════════════
const MENU = {
    download: {
        icon: '📥', label: 'Downloads',
        items: [
            { cmd: '.song', desc: 'YouTube Song' },
            { cmd: '.yt', desc: 'YouTube Video' },
            { cmd: '.tiktok', desc: 'TikTok Downloader' },
            { cmd: '.fb', desc: 'Facebook Video' },
            { cmd: '.ig', desc: 'Instagram Post' },
            { cmd: '.twitter', desc: 'Twitter/X Video' },
            { cmd: '.apk', desc: 'Download APK' },
            { cmd: '.mega', desc: 'MEGA Download' },
            { cmd: '.mediafire', desc: 'MediaFire' },
            { cmd: '.novel', desc: 'Sinhala Novel PDF' }
        ]
    },
    ai: {
        icon: '🧠', label: 'AI & Fun',
        items: [
            { cmd: '.alya', desc: 'AI Girlfriend Alya 💕' },
            { cmd: '.sumi', desc: 'AI Girlfriend Sumi 💋' },
            { cmd: '.deepseek', desc: 'DeepSeek AI' },
            { cmd: '.wormgpt', desc: 'AI Chat Bot' },
            { cmd: '.text2img', desc: 'AI Image Gen' },
            { cmd: '.vchange', desc: 'Voice Changer' },
            { cmd: '.pupilmv', desc: 'Movie Search AI' }
        ]
    },
    tools: {
        icon: '🛠️', label: 'Tools',
        items: [
            { cmd: '.qr', desc: '📷 QR Code Generator' },
            { cmd: '.qrscan', desc: 'QR Scanner' },
            { cmd: '.getpp', desc: 'Profile Picture' },
            { cmd: '.lyrics', desc: 'Song Lyrics' },
            { cmd: '.tts', desc: 'Text to Speech' },
            { cmd: '.sinhala', desc: 'Sinhala TTS' },
            { cmd: '.sticker', desc: 'Make Sticker' },
            { cmd: '.tomp3', desc: 'Convert to MP3' },
            { cmd: '.fetch', desc: 'Fetch URL' },
            { cmd: '.npm', desc: 'npm Search' }
        ]
    },
    games: {
        icon: '🎮', label: 'Games',
        items: [
            { cmd: '.chess', desc: '♟️ Chess' },
            { cmd: '.dino', desc: '🦖 Chrome Dino' },
            { cmd: '.flappy', desc: '🐦 Flappy Bird' },
            { cmd: '.galaxy', desc: '👾 Galaxy Attack' },
            { cmd: '.car', desc: '🏎️ Highway Rush' }
        ]
    },
    movie: {
        icon: '🎬', label: 'Movies & Anime',
        items: [
            { cmd: '.movie', desc: 'Movie Engine' },
            { cmd: '.cz', desc: 'CineSubz' },
            { cmd: '.sinhalasubw', desc: 'SinhalaSub.lk' },
            { cmd: '.anime', desc: 'SL Anime' },
            { cmd: '.slcartoon', desc: 'Sinhala Cartoon' },
            { cmd: '.hanime', desc: 'Hanime Search' }
        ]
    },
    group: {
        icon: '👥', label: 'Group Mgmt',
        items: [
            { cmd: '.add', desc: 'Add member' },
            { cmd: '.kick', desc: 'Remove member' },
            { cmd: '.promote', desc: 'Promote' },
            { cmd: '.demote', desc: 'Demote' },
            { cmd: '.mute', desc: 'Lock group' },
            { cmd: '.unmute', desc: 'Unlock' },
            { cmd: '.hidetag', desc: 'Silent tag all' },
            { cmd: '.mention', desc: 'Mention all' },
            { cmd: '.antilink', desc: 'Anti-link toggle' }
        ]
    },
    owner: {
        icon: '⚙️', label: 'Owner',
        items: [
            { cmd: '.botinfo', desc: 'Bot Info' },
            { cmd: '.settings', desc: 'Settings' },
            { cmd: '.plugins', desc: 'Show Plugins' },
            { cmd: '.pair', desc: 'Pairing Code' },
            { cmd: '.restart', desc: 'Restart Bot' },
            { cmd: '.update', desc: 'Redeploy' },
            { cmd: '.setprefix', desc: 'Set Prefix' }
        ]
    },
    nsfw: {
        icon: '🔞', label: '18+ Adult',
        items: [
            { cmd: '.hentai', desc: '🔞 Hentai Search' },
            { cmd: '.xxx', desc: '🔞 Adult Downloader' }
        ]
    }
};

// ══════════════════════════════════════════════════════════════
//  .menu3 — Button Menu
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'menu3',
    alias: ['bmenu', 'buttonmenu', 'menub'],
    desc: 'Button-based interactive menu',
    category: 'main',
    react: '🔘',
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🔘', key: mek.key } });

        const userName = m.pushName || 'User';
        const now = new Date();
        const timeStr = now.toLocaleString('en-US', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        const totalCmds = Object.values(MENU).reduce((a, c) => a + c.items.length, 0);

        // Build category buttons (native flow sections style)
        const sections = Object.keys(MENU).map(key => {
            const cat = MENU[key];
            return {
                title: `${cat.icon} ${cat.label} (${cat.items.length})`,
                rows: cat.items.slice(0, 10).map(item => ({
                    header: '',
                    title: item.cmd,
                    description: item.desc,
                    id: item.cmd
                }))
            };
        });

        // ═══════════════════════════════════════════
        //  BUTTON-BASED MENU (Native Flow)
        // ═══════════════════════════════════════════
        const caption =
            `🎨 *SHAVIYA-XMD MENU*\n\n` +
            `👤 *User:* ${userName}\n` +
            `⏰ *Time:* ${timeStr}\n` +
            `📊 *Total:* ${totalCmds} commands\n` +
            `🔢 *Categories:* ${Object.keys(MENU).length}\n\n` +
            `👇 *Select a category below*\n\n${CREDIT}`;

        await conn.sendMessage(from, {
            text: caption,
            footer: FOOTER,
            title: '🎨 SHAVIYA-XMD',
            buttonText: '📋 Browse Commands',
            sections: sections,
            // Native flow buttons
            nativeFlow: [
                {
                    text: '📋 Browse Menu',
                    sections: sections,
                    icon: 'default'
                },
                {
                    text: '📞 Support',
                    call: '94707085822'
                },
                {
                    text: '🌐 Website',
                    url: 'https://github.com/cybernoxx-cdt/SHAVIYA-XMD',
                    useWebview: true
                }
            ]
        }, { quoted: mek });

        // ═══════════════════════════════════════════
        //  SIMPLE BUTTONS (Category quick access)
        // ═══════════════════════════════════════════
        const catButtons = Object.keys(MENU).map(key => ({
            text: `${MENU[key].icon} ${MENU[key].label}`,
            id: `#cat_${key}`
        }));

        await conn.sendMessage(from, {
            text: `⚡ *Quick Access Categories*\n\n👇 Tap any button for instant category commands`,
            footer: FOOTER,
            buttons: catButtons.slice(0, 5)
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[MENU3] Error:', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return reply('❌ Menu3 load error: ' + err.message);
    }
});

// ══════════════════════════════════════════════════════════════
//  .cat <name> — Show specific category commands
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'cat',
    alias: ['category', 'getcat'],
    desc: 'Show specific category',
    category: 'main',
    react: '📋',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const key = (args[0] || '').toLowerCase().trim();
        if (!key || !MENU[key]) {
            const keys = Object.keys(MENU).join(', ');
            return reply(`❌ *Usage:* \`.cat <category>\`\n\n📋 *Available:*\n${keys}`);
        }

        const cat = MENU[key];

        await conn.sendMessage(from, { react: { text: cat.icon, key: mek.key } });

        let text = `${cat.icon} *${cat.label.toUpperCase()}*\n\n`;
        for (const item of cat.items) {
            text += `🔹 *${item.cmd}* — ${item.desc}\n`;
        }
        text += `\n📊 *Total:* ${cat.items.length} commands\n\n${CREDIT}`;

        // Send with button to select another category
        const otherCats = Object.keys(MENU).filter(k => k !== key).slice(0, 5);
        const buttons = otherCats.map(k => ({
            text: `${MENU[k].icon} ${MENU[k].label}`,
            id: `#cat_${k}`
        }));

        await conn.sendMessage(from, {
            text: text,
            footer: FOOTER,
            buttons: buttons
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[CAT] Error:', err.message);
        reply(`❌ Error: ${err.message}`);
    }
});
