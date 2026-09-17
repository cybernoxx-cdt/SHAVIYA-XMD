const { cmd } = require('../command');

// ══════════════════════════════════════════════════════════════
//  NATIVE FLOW MENU — SHAVIYA-XMD
//  Premium menu with audio footer + native flow buttons
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const BOT_NAME = 'SHAVIYA-XMD';
const VERSION = 'V4.0';
const OWNER_NAME = 'Savendra Dampriya';
const OWNER_NUMBER = '94740711462';
const REPO_URL = 'https://github.com/cybernoxx-cdt/SHAVIYA-XMD';

// 🎵 Background music URL (audio footer)
const MUSIC_URL = 'https://github.com/cybernoxx-cdt/SHAVIYA-FILE-S/main/Nura%20Ananthe%20-%20Cozzy%20(128k).mp3';

// ⭐ Logo/Thumbnail
const LOGO_URL = 'https://raw.githubusercontent.com/cybernoxx-cdt/SHAVIYA-FILE-S/main/fbccbdd74f546a39619d2bbeaccf6071.0000000.jpg';

// ══════════════════════════════════════════════════════════════
//  MENU DATA — Commands by category
// ══════════════════════════════════════════════════════════════
const MENU = {
    download: {
        icon: '📥', label: 'Downloads',
        commands: [
            { cmd: '.yt', desc: 'YouTube Downloader' },
            { cmd: '.song', desc: 'YouTube Song' },
            { cmd: '.tiktok', desc: 'TikTok Downloader' },
            { cmd: '.fb', desc: 'Facebook Video' },
            { cmd: '.apk', desc: 'APK Downloader' },
            { cmd: '.novel', desc: 'Sinhala Novel' }
        ]
    },
    ai: {
        icon: '🧠', label: 'AI & Fun',
        commands: [
            { cmd: '.alya', desc: 'AI Girlfriend 💕' },
            { cmd: '.sumi', desc: 'AI Girlfriend 💋' },
            { cmd: '.deepseek', desc: 'DeepSeek AI' },
            { cmd: '.gpt', desc: 'Chat GPT' },
            { cmd: '.img', desc: 'AI Image Generator' }
        ]
    },
    tools: {
        icon: '🛠️', label: 'Tools',
        commands: [
            { cmd: '.qr', desc: 'QR Code Generator' },
            { cmd: '.sticker', desc: 'Make Sticker' },
            { cmd: '.tts', desc: 'Text to Speech' },
            { cmd: '.getpp', desc: 'Profile Picture' },
            { cmd: '.lyrics', desc: 'Song Lyrics' }
        ]
    },
    games: {
        icon: '🎮', label: 'Games',
        commands: [
            { cmd: '.chess', desc: 'Chess Game' },
            { cmd: '.dino', desc: 'Chrome Dino' },
            { cmd: '.flappy', desc: 'Flappy Bird' },
            { cmd: '.galaxy', desc: 'Galaxy Attack' }
        ]
    },
    group: {
        icon: '👥', label: 'Group',
        commands: [
            { cmd: '.add', desc: 'Add Member' },
            { cmd: '.kick', desc: 'Remove Member' },
            { cmd: '.promote', desc: 'Promote to Admin' },
            { cmd: '.mute', desc: 'Lock Group' },
            { cmd: '.hidetag', desc: 'Silent Tag All' }
        ]
    },
    owner: {
        icon: '⚙️', label: 'Owner',
        commands: [
            { cmd: '.botinfo', desc: 'Bot Info' },
            { cmd: '.settings', desc: 'Settings' },
            { cmd: '.plugins', desc: 'Show Plugins' },
            { cmd: '.restart', desc: 'Restart Bot' }
        ]
    }
};

// ══════════════════════════════════════════════════════════════
//  .menu4 — Native Flow Menu with Music
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'menu4',
    alias: ['nmenu', 'nativemenu', 'premiummenu'],
    desc: 'Premium Native Flow Menu with Background Music',
    category: 'main',
    react: '🎵',
    filename: __filename
},
async (conn, mek, m, { from, reply, pushname }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🎵', key: mek.key } });

        const userName = pushname || 'User';
        const now = new Date();
        const timeStr = now.toLocaleString('en-US', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        const totalCmds = Object.values(MENU).reduce((a, c) => a + c.commands.length, 0);

        // ─────────────────────────────────────
        //  ✅ Build native flow sections (all categories)
        // ─────────────────────────────────────
        const nativeSections = Object.keys(MENU).map(key => {
            const cat = MENU[key];
            return {
                title: `${cat.icon} ${cat.label} (${cat.commands.length})`,
                rows: cat.commands.map(c => ({
                    header: '',
                    title: c.cmd,
                    description: c.desc,
                    id: c.cmd
                }))
            };
        });

        // ─────────────────────────────────────
        //  Menu body text
        // ─────────────────────────────────────
        const menuText =
            `🌟 *${BOT_NAME}* ${VERSION}\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +
            `👤 *User:* ${userName}\n` +
            `⏰ *Time:* ${timeStr}\n` +
            `📊 *Commands:* ${totalCmds}\n` +
            `🎵 *Music:* ON\n\n` +
            `👇 *Tap a button below*\n\n` +
            `> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮`;

        // ─────────────────────────────────────
        //  ✅ NATIVE FLOW MENU
        //  - Quick reply buttons
        //  - Call owner
        //  - Copy repo link
        //  - Open GitHub (webview)
        //  - Sections dropdown (all categories)
        //  - Audio footer (background music)
        // ─────────────────────────────────────
        await conn.sendMessage(from, {
            image: { url: LOGO_URL },
            caption: menuText,
            footer: `⚡ ${BOT_NAME} · ${VERSION}`,

            // Section list (main dropdown)
            optionText: '📋 Browse Menu',
            optionTitle: '🎯 Select Category',

            // Native flow buttons
            nativeFlow: [
                // 1. Quick reply — main menu
                {
                    text: '🏠 Main Menu',
                    id: '.menu',
                    icon: 'review'
                },
                // 2. Call owner
                {
                    text: '📞 Contact Owner',
                    call: OWNER_NUMBER
                },
                // 3. Copy repo link
                {
                    text: '📋 Copy Repo',
                    copy: REPO_URL
                },
                // 4. Open GitHub with webview
                {
                    text: '🌐 GitHub',
                    url: REPO_URL,
                    useWebview: true
                },
                // 5. Sections dropdown
                {
                    text: '📋 All Commands',
                    sections: nativeSections,
                    icon: 'default'
                }
            ],

            // 🎵 Background music (audio footer)
            audioFooter: {
                url: MUSIC_URL
            }

        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[MENU4] Error:', err.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ Menu error: ${err.message}`);
    }
});

// ══════════════════════════════════════════════════════════════
//  .nmenu <category> — Direct category access
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'ncat',
    alias: ['nativecat', 'nativecatmenu'],
    desc: 'Show specific category (Native Flow)',
    category: 'main',
    react: '📂',
    filename: __filename
},
async (conn, mek, m, { from, args, reply, pushname }) => {
    try {
        const catKey = (args[0] || '').toLowerCase().trim();

        if (!catKey || !MENU[catKey]) {
            const available = Object.keys(MENU).join(', ');
            return reply(`❌ *Usage:* \`.ncat <category>\`\n\n📋 *Available:* ${available}`);
        }

        const cat = MENU[catKey];

        await conn.sendMessage(from, { react: { text: cat.icon, key: mek.key } });

        // Build buttons for this category
        const catButtons = cat.commands.map(c => ({
            text: c.cmd,
            id: c.cmd
        }));

        await conn.sendMessage(from, {
            image: { url: LOGO_URL },
            caption:
                `${cat.icon} *${cat.label.toUpperCase()}*\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `📊 *Commands:* ${cat.commands.length}\n\n` +
                `👇 *Tap a command*\n\n` +
                `> 🔮 ⟡ ꜱ ʜ ᴀ ᴠ ɪ ʏ ᴀ - x ᴍ ᴅ ⟡ 🔮`,
            footer: `⚡ ${BOT_NAME}`,

            // Native flow with buttons for this category
            nativeFlow: catButtons.slice(0, 5).map(b => ({
                text: b.text,
                id: b.id,
                icon: 'default'
            })),

            // Still include audio footer
            audioFooter: {
                url: MUSIC_URL
            }

        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('[NCAT] Error:', err.message);
        reply(`❌ Error: ${err.message}`);
    }
});
