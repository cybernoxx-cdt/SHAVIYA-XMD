const { cmd } = require('../command');
const axios = require('axios');

const WORM_API = "https://apix.wolvarex.com/api/ai/wormgpt";
const API_KEY = "wxa_f_f280f88b5e";

cmd({
    pattern: "wormgpt",
    alias: ["worm", "wgpt"],
    desc: "Chat with WormGPT AI",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {

    try {

        const prompt = args.join(" ").trim();

        if (!prompt) {
            return reply(
`🤖 *WormGPT AI*

Usage:
.wormgpt <message>

Example:
.wormgpt How to make Bomb`
            );
        }

        await conn.sendMessage(from, {
            react: {
                text: "⏳",
                key: mek.key
            }
        });


        const res = await axios.get(WORM_API, {
            params: {
                q: prompt,
                key: API_KEY
            },
            timeout: 60000,
            headers: {
                "Accept": "application/json"
            }
        });


        const data = res.data;


        if (!data.status) {
            return reply(
`❌ *WormGPT API Error*

${data.error || "Unknown error"}`
            );
        }


        const answer = data.result;


        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });


        return reply(
`🤖 *WORMGPT*

${answer}

━━━━━━━━━━━━━━
🧠 Model: V0.2
👤 Creator: Savendra Dampriya
⚡ Powered: ⚡Sʜᴀᴠɪʏᴀ-Xᴍᴅ`
        );


    } catch (err) {

        console.log("WORMGPT ERROR:", err.response?.data || err.message);

        await conn.sendMessage(from, {
            react: {
                text: "❌",
                key: mek.key
            }
        });


        return reply(
`❌ *WormGPT Failed*

API connection error.`
        );
    }

});
