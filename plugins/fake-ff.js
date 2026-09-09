// plugins/fake-ff.js — SHAVIYA-XMD | Fake Free Fire Card Generator
const { cmd } = require("../command");
const axios = require("axios");

// ───────── CONFIGURATION ─────────
const API_BASE  = "https://whiteshadow-x-api.onrender.com/api/tools/fake-ff";
const API_TOKEN = "e76n2P";
const FOOTER     = "🔰 𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃 𝐅𝐀𝐊𝐄-𝐅𝐅 🎮";

cmd({
    pattern: "fakeff",
    alias: ["fff", "ffcard"],
    desc: "Generate a fake Free Fire profile card image",
    category: "tools",
    react: "🎮",
    filename: __filename,
    use: ".fakeff <username>"
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        // Username eka dila thiyenawada balamu
        if (!q || !q.trim()) {
            return reply("❌ කරුණාකර username එකක් දෙන්න.\n\n*උදා:* `.fakeff WhiteShadow`");
        }

        const username = q.trim();

        // Processing react
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // API URL eka hadaganimu
        const apiUrl = `${API_BASE}?username=${encodeURIComponent(username)}&apitoken=${API_TOKEN}`;

        // Image eka arraybuffer widihata fetch karamu (API eka direct image return karana nisa)
        const res = await axios.get(apiUrl, {
            responseType: "arraybuffer",
            timeout: 60000
        });

        const contentType = res.headers["content-type"] || "";

        // API eken error (JSON) ekak awoth eka pennanna
        if (contentType.includes("application/json")) {
            let errData = {};
            try { errData = JSON.parse(Buffer.from(res.data).toString("utf-8")); } catch {}
            return reply(`❌ Error: ${errData.message || errData.error || "Card eka generate karanna baruna."}`);
        }

        const imageBuffer = Buffer.from(res.data);

        await conn.sendMessage(from, { react: { text: "🖼️", key: m.key } });

        // Card eka yawamu
        await conn.sendMessage(from, {
            image: imageBuffer,
            caption: `🎮 *FAKE FREE FIRE CARD*\n\n👤 *Username:* ${username}\n\n${FOOTER}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("❌ Fake-FF Error:", e.message);
        reply(`❌ Error: Card eka generate karanna baruna. (${e.message})`);
    }
});
