const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

const footer = "> © Powerd by Sʜᴀᴠɪʏᴀ-Xᴍᴅ 🌝";
const menuImage = "https://files.catbox.moe/8fxouz.jpg";

// ================================
// ZANTA MINI API CONFIG
// ================================
const API_KEY = "zan_vWpU1lkr_g6wwxdlvyv";

const SEARCH_API = "https://api.zanta-mini.store/api/xnxx/search";
const DOWNLOAD_API = "https://api.zanta-mini.store/api/xnxx/dl";

let isChoosing = false;
let isChoosingQuality = false;

cmd({
    pattern: "xnxx",
    alias: ["xvdl", "xxx", "phv"],
    use: ".xnxx <video name>",
    react: "🤤",
    desc: "Search & download xnxx.com videos (18+).",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { q, from, reply }) => {

    try {
        if (!q) {
            return await reply("❌ Please enter a video name!");
        }

        isChoosing = false;
        isChoosingQuality = false;

        // ================================
        // SEARCH API
        // ================================
        const searchUrl =
            `${SEARCH_API}?apiKey=${encodeURIComponent(API_KEY)}` +
            `&url=${encodeURIComponent(q)}`;

        const searchApi = await fetchJson(searchUrl);

        console.log("SEARCH API RESPONSE:", JSON.stringify(searchApi, null, 2));

        // Try common response structures
        const results =
            searchApi?.result?.xvideos ||
            searchApi?.result?.results ||
            searchApi?.results ||
            searchApi?.data ||
            [];

        if (!Array.isArray(results) || !results.length) {
            return await reply("❌ No results found!");
        }

        let listText =
            "🤤 𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃 XNXX SEARCH RESULTS\n\n" +
            "🔢 *Reply a number to choose a result.*\n\n";

        results.forEach((item, i) => {
            listText +=
                `*${i + 1}.* | ${item.title || item.name || "No title"}\n`;
        });

        const listMsg = await conn.sendMessage(
            from,
            {
                image: { url: menuImage },
                caption: listText + `\n\n${footer}`
            },
            { quoted: mek }
        );

        const handleChoose = async (update) => {
            try {
                const msg = update.messages?.[0];
                if (!msg?.message) return;

                const txt =
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text;

                if (!txt) return;

                const isReply =
                    msg.message.extendedTextMessage?.contextInfo?.stanzaId ===
                    listMsg.key.id;

                if (!isReply) return;
                if (isChoosing) return;

                isChoosing = true;

                const index = parseInt(txt.trim(), 10) - 1;

                if (
                    isNaN(index) ||
                    index < 0 ||
                    index >= results.length
                ) {
                    isChoosing = false;
                    return await reply("❌ Invalid number!");
                }

                const chosen = results[index];

                const videoUrl =
                    chosen.link ||
                    chosen.url ||
                    chosen.videoUrl;

                if (!videoUrl) {
                    isChoosing = false;
                    return await reply("❌ Video URL not found in API response!");
                }

                // ================================
                // DOWNLOAD API
                // ================================
                const downloadUrl =
                    `${DOWNLOAD_API}?apiKey=${encodeURIComponent(API_KEY)}` +
                    `&url=${encodeURIComponent(videoUrl)}`;

                const downloadApi = await fetchJson(downloadUrl);

                console.log(
                    "DOWNLOAD API RESPONSE:",
                    JSON.stringify(downloadApi, null, 2)
                );

                const info = downloadApi?.result;

if (!info) {
    isChoosing = false;
    return await reply("❌ Invalid download API response!");
}

const HQ = info?.dl_links?.high;
const LQ = info?.dl_links?.low;

if (!HQ && !LQ) {
    isChoosing = false;
    return await reply("❌ Download links were not found in the API response!");
}

                const thumbnail =
                    info?.thumbnail ||
                    chosen.thumbnail ||
                    menuImage;

                const title =
                    info?.title ||
                    chosen.title ||
                    chosen.name ||
                    "XNXX Video";

                const duration =
                    info?.duration ||
                    chosen.duration ||
                    "Unknown";

                const askMsg = await conn.sendMessage(
                    from,
                    {
                        image: { url: thumbnail },
                        caption:
                            `*🔞 VIDEO INFO*\n\n` +
                            `*Title:* ${title}\n` +
                            `*Duration:* ${duration}\n\n` +
                            `Reply number:\n` +
                            `1 | High Quality\n` +
                            `2 | Low Quality\n\n` +
                            `${footer}`
                    },
                    { quoted: msg }
                );

                const handleQuality = async (u) => {
                    try {
                        const t = u.messages?.[0];
                        if (!t?.message) return;

                        const choice =
                            t.message.conversation ||
                            t.message.extendedTextMessage?.text;

                        if (!choice) return;

                        const isReplyQ =
                            t.message.extendedTextMessage
                                ?.contextInfo?.stanzaId === askMsg.key.id;

                        if (!isReplyQ) return;
                        if (isChoosingQuality) return;

                        isChoosingQuality = true;

                        let sendURL;

                        if (choice.trim() === "1") {
                            sendURL = HQ;
                        } else if (choice.trim() === "2") {
                            sendURL = LQ;
                        } else {
                            isChoosingQuality = false;
                            return await reply(
                                "❌ Enter *1* or *2* only!"
                            );
                        }

                        if (!sendURL) {
                            isChoosingQuality = false;
                            return await reply(
                                "❌ Selected quality is unavailable!"
                            );
                        }

                        await conn.sendMessage(from, {
                            react: {
                                text: "⬇️",
                                key: t.key
                            }
                        });

                        await conn.sendMessage(from, {
                            react: {
                                text: "⬆️",
                                key: t.key
                            }
                        });

                        await conn.sendMessage(
                            from,
                            {
                                video: {
                                    url: sendURL
                                },
                                caption: `🔞 Video\n> ${title}`
                            },
                            { quoted: t }
                        );

                        await conn.sendMessage(from, {
                            react: {
                                text: "✔️",
                                key: t.key
                            }
                        });

                        isChoosing = false;
                        isChoosingQuality = false;

                    } catch (qualityErr) {
                        console.log("QUALITY ERROR:", qualityErr);

                        isChoosing = false;
                        isChoosingQuality = false;

                        await reply(
                            "❌ Failed to process the selected quality."
                        );
                    }
                };

                conn.ev.on("messages.upsert", handleQuality);

            } catch (chooseErr) {
                console.log("CHOOSE ERROR:", chooseErr);

                isChoosing = false;
                isChoosingQuality = false;

                await reply("❌ Error processing your selection.");
            }
        };

        conn.ev.on("messages.upsert", handleChoose);

    } catch (err) {
        console.log("XNXX PLUGIN ERROR:", err);

        isChoosing = false;
        isChoosingQuality = false;

        await reply("❌ Error: " + (err.message || err));
    }
});
