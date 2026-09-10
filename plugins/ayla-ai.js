const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "ayla",
    alias: ["gf", "girl"],
    desc: "Chat with AYLA AI Girlfriend",
    category: "ai",
    react: "💖",
    filename: __filename
},
async(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, reply }) => {
    try {
        if (!q) return reply("⚠️ කරුණාකර Ayla එක්ක කතා කරන්න මොනවා හරි කියන්න.\n\n*Example:* `.ayla hi baby`");

        // GitHub Secret / Environment Variable එකෙන් API Key එක ලබා ගැනීම
        const apiKey = process.env.GEMINI_API_KEY || config.GEMINI_API_KEY;

        if (!apiKey) {
            return reply("❌ API Key එක හමු වුණේ නැත! කරුණාකර GitHub Secrets වල GEMINI_API_KEY ලෙස API Key එක සෙට් කරන්න.");
        }

        const model = "gemini-3.5-flash-lite"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const systemPrompt = "You are Ayla, a loving, caring, and sweet virtual girlfriend. Reply warmly and affectionately in a natural conversation style.";
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
