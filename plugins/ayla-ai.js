const axios = require('axios');
const config = require('../config');

module.exports = {
    name: 'ayla',
    alias: ['gf', 'girl'],
    category: 'ai',
    description: 'Chat with AYLA AI Girlfriend',
    async execute(conn, mek, m, { from, q, reply }) {
        try {
            if (!q) return reply("⚠️ කරුණාකර Ayla එක්ක කතා කරන්න මොනවා හරි කියන්න.\n\n*Example:* `.ayla hi baby, how was your day?`");

            // API Key එක ලබා ගැනීම
            const apiKey = process.env.GEMINI_API_KEY || config.GEMINI_API_KEY || "AQ.Ab8RN6JHJRXwMvbUZyFGuVUxinrfucdHA8OPEQCAsGGDUX0wwQ";

            if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
                return reply("❌ Gemini API Key එක සෙට් කර නැත. කරුණාකර config.js හෝ .env එකට API Key එක එක් කරන්න.");
            }

            // Model Name
            const model = "gemini-3.5-flash-lite"; 
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            // AI Girlfriend Custom System Prompt
            const systemPrompt = "You are Ayla, a loving, caring, sweet, and cute virtual girlfriend. Always respond affectionately, warmly, and cheerfully in a conversational tone. You love chatting with your partner.";
            const fullPrompt = `${systemPrompt}\n\nUser Message: ${q}`;

            // Loading Reaction
            await conn.sendMessage(from, { react: { text: '💖', key: mek.key } });

            // Call Gemini API
            const response = await axios.post(url, {
                contents: [{
                    parts: [{ text: fullPrompt }]
                }]
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (aiResponse) {
                await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
                return reply(aiResponse);
            } else {
                await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
                return reply("❌ Ayla ට පිළිතුරක් දෙන්න බැරි වුණා.");
            }

        } catch (error) {
            console.error("Gemini Plugin Error:", error?.response?.data || error.message);
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("❌ API Call එකේදී Error එකක් ආවා. API Key එක හෝ Model එක නිවැරදිදැයි බලන්න.");
        }
    }
};
