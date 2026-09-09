// plugins/ff-search.js — SHAVIYA-XMD | Free Fire UID Search
const { cmd } = require("../command");
const axios = require("axios");

// ───────── CONFIGURATION ─────────
const API_BASE  = "https://whiteshadow-x-api.onrender.com/api/tools/ff-search";
const API_TOKEN = "e76n2P";
const FOOTER     = "🔰 𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃 𝐅𝐅 𝐒𝐄𝐀𝐑𝐂𝐇 🎮";

function fmtDate(ts) {
    if (!ts || ts === "0") return "N/A";
    const d = new Date(Number(ts) * 1000);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

cmd({
    pattern: "ffsearch",
    alias: ["ffinfo", "ffuid"],
    desc: "Search a Free Fire player's info by UID",
    category: "tools",
    react: "🔥",
    filename: __filename,
    use: ".ffsearch <uid>"
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        // UID eka dila thiyenawada balamu
        if (!q || !q.trim() || !/^\d+$/.test(q.trim())) {
            return reply("❌ කරුණාකර වලංගු Free Fire UID එකක් දෙන්න.\n\n*උදා:* `.ffsearch 9666937473`");
        }

        const uid = q.trim();

        // Processing react
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // API eken player data ganimu
        const apiUrl = `${API_BASE}?uid=${encodeURIComponent(uid)}&apitoken=${API_TOKEN}`;
        const res = await axios.get(apiUrl, { timeout: 30000 });
        const data = res.data;

        if (!data || !data.status || !data.data || !data.data.player) {
            return reply(`❌ UID *${uid}* එකට ගැලපෙන player කෙනෙක් හම්බුනේ නෑ.`);
        }

        const p = data.data.player;
        const guild = p.guild || {};
        const ban = p.ban || {};
        const credit = p.credit || {};
        const social = p.social || {};

        const caption = `🎮 *FREE FIRE PLAYER INFO*

👤 *Nickname:* ${p.nickname || "N/A"}
🆔 *UID:* ${p.accountId || uid}
🌍 *Region:* ${data.data.meta?.region || "N/A"}
📶 *Level:* ${p.level || "N/A"}  (EXP: ${p.exp || 0})

🏆 *BR Rank:* ${p.rank || "N/A"}  (Points: ${p.rankingPoints || 0})
🎯 *CS Rank:* ${p.csRank || "N/A"}  (Points: ${p.csRankingPoints || 0})
❤️ *Likes:* ${p.liked || 0}
🎖️ *Badges:* ${p.badgeCnt || 0}
👑 *Elite Pass:* ${p.hasElitePass ? "Yes" : "No"}
✨ *Credit Score:* ${credit.creditScore ?? "N/A"}

🏠 *Guild:* ${guild.guildName || "No Guild"}
   ↳ Level ${guild.guildLevel || "N/A"} | Members: ${guild.memberNum || 0}/${guild.capacity || 0}

📅 *Account Created:* ${fmtDate(p.createAt)}
🕓 *Last Login:* ${fmtDate(p.lastLoginAt)}
🚫 *Ban Status:* ${ban.status || (ban.isBanned ? "BANNED" : "NOT BANNED")}
${social.signature ? `\n💬 *Bio:* ${social.signature}` : ""}

${FOOTER}`;

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

        // Avatar image ekath ekka pattern eka yawamu, na natam plain text
        if (p.avatarUrl) {
            try {
                await conn.sendMessage(from, {
                    image: { url: p.avatarUrl },
                    caption
                }, { quoted: mek });
                return;
            } catch {
                // avatar fetch fail unoth text witharak yawamu
            }
        }

        await conn.sendMessage(from, { text: caption }, { quoted: mek });

    } catch (e) {
        console.error("❌ FF-Search Error:", e.message);
        reply(`❌ Error: Player data eka fetch karanna baruna. (${e.message})`);
    }
});
