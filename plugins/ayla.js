require('dotenv').config(); // .env ෆයිල් එක Auto-Load කිරීමට
const axios = require('axios');
const { cmd, commands } = require('../command');

cmd({
    pattern: "ayla",
    alias: ["gf", "girl"],
    desc: "Chat with AYLA AI",
    category: "ai",
    react: "💖",
    filename: __filename
},
async(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, reply }) => {
    try {
        if (!q) return reply("⚠️ කරුණාකර Message එකක් යවන්න.\n\n*Example:* `.ayla hi`");

        // Environment Variables වලින් API Key එක ලබා ගැනීම
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return reply("❌ GEMINI_API_KEY එක හමු වුණේ නැත! කරුණාකර `.env` හෝ GitHub Secrets පරීක්ෂා කරන්න.");
        }

        const model = "gemini-3.5-flash-lite"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const systemPrompt = "You are Ayla, a friendly, sweet, and caring virtual AI assistant. Respond warmly, politely, and helpfully in a natural tone.";
        const fullPrompt = `${systemPrompt}\n\nUser: ${q}`;

        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: fullPrompt }]
            }]
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (aiResponse) {
            return await reply(aiResponse);
        } else {
            return await reply("❌ Ayla ට පිළිතුරක් ලබා ගැනීමට නොහැකි විය.");
        }

    } catch (e) {
        console.error("Ayla Error Log:", e?.response?.data || e.message);
        let errorMsg = e?.response?.data?.error?.message || e.message;
        return reply(`❌ API Error: ${errorMsg}`);
    }
});
