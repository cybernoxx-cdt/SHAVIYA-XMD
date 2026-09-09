const { cmd } = require("../command");
const axios = require("axios");

// ================================
// MODAPK API CONFIG - HARD CODED
// ================================
const API_BASE = "https://whiteshadow-x-api.onrender.com/api/download/apkmody";
const API_TOKEN = "e76n2P";

// User search results temporarily store
const apkResults = new Map();

function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return "Unknown";

    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// ==========================================
// .modapk <app name>
// Search MOD APK
// ==========================================
cmd(
    {
        pattern: "modapk2",
        alias: ["apkmod2", "mod"],
        react: "📱",
        desc: "Search MOD APK",
        category: "download",
        filename: __filename
    },
    async (conn, mek, m, { q, reply, from }) => {

        if (!q) {
            return reply(
                "❌ *Please give an app or game name!*\n\n" +
                "📌 *Example:*\n" +
                ".modapk subway surfers"
            );
        }

        try {
            await conn.sendMessage(from, {
                react: {
                    text: "🔎",
                    key: mek.key
                }
            });

            const response = await axios.get(API_BASE, {
                params: {
                    q: q,
                    apitoken: API_TOKEN
                },
                timeout: 30000
            });

            const data = response.data;

            if (!data?.status || !data?.result?.items?.length) {
                return reply(
                    "❌ *No MOD APK found!*\n\n" +
                    `🔎 Search: *${q}*`
                );
            }

            const apps = data.result.items;

            // Store search results for this chat
            apkResults.set(from, apps);

            let text = `📱 *MOD APK SEARCH RESULTS*\n\n`;
            text += `🔎 *Query:* ${data.result.query}\n`;
            text += `📦 *Results:* ${data.result.count}\n\n`;

            apps.forEach((app, i) => {
                text += `*${i + 1}. ${app.title}*\n`;
                text += `📦 Version: ${app.version || "Unknown"}\n\n`;
            });

            text += `━━━━━━━━━━━━━━━━━━\n`;
            text += `📥 *Reply with a number to download*\n`;
            text += `Example: *1*`;

            await conn.sendMessage(
                from,
                { text },
                { quoted: mek }
            );

            await conn.sendMessage(from, {
                react: {
                    text: "✅",
                    key: mek.key
                }
            });

        } catch (error) {
            console.error("MODAPK Search Error:", error?.response?.data || error.message);

            await conn.sendMessage(from, {
                react: {
                    text: "❌",
                    key: mek.key
                }
            });

            return reply(
                "❌ *Search failed!*\n\n" +
                "Please try again later."
            );
        }
    }
);


// ==========================================
// Reply 1 / 2 / 3 to download selected MOD
// ==========================================
cmd(
    {
        on: "text"
    },
    async (conn, mek, m, { body, from, reply }) => {

        if (!apkResults.has(from)) return;

        const number = parseInt(body);

        if (
            isNaN(number) ||
            number < 1 ||
            number > apkResults.get(from).length ||
            body.trim() !== String(number)
        ) {
            return;
        }

        const apps = apkResults.get(from);
        const selectedApp = apps[number - 1];

        if (!selectedApp?.title) {
            apkResults.delete(from);
            return;
        }

        try {
            await conn.sendMessage(from, {
                react: {
                    text: "⏳",
                    key: mek.key
                }
            });

            await conn.sendMessage(
                from,
                {
                    text:
                        `📥 *Getting download link...*\n\n` +
                        `📱 *${selectedApp.title}*`
                },
                { quoted: mek }
            );

            // Auto download API
            const response = await axios.get(API_BASE, {
                params: {
                    q: selectedApp.title,
                    auto: "true",
                    apitoken: API_TOKEN
                },
                timeout: 60000
            });

            const data = response.data;

            if (
                !data?.status ||
                !data?.result ||
                !data?.result?.downloads?.length
            ) {
                apkResults.delete(from);

                await conn.sendMessage(from, {
                    react: {
                        text: "❌",
                        key: mek.key
                    }
                });

                return reply("❌ *Download link not found!*");
            }

            const app = data.result;
            const download = app.downloads[0];

            let caption = `📱 *MOD APK DOWNLOADER*\n\n`;

            caption += `🎮 *Name:* ${app.title || selectedApp.title}\n`;
            caption += `📦 *Version:* ${app.version || "Unknown"}\n`;
            caption += `✨ *MOD:* ${app.mod || "Unknown"}\n`;
            caption += `📁 *Package:* ${app.package || "Unknown"}\n`;
            caption += `🗂️ *Type:* ${download.type || "APK"}\n`;
            caption += `💾 *Size:* ${
                download.size ||
                formatBytes(download.sizeBytes)
            }\n`;

            if (app.updated) {
                caption += `🗓️ *Updated:* ${new Date(app.updated).toLocaleDateString()}\n`;
            }

            caption += `\n━━━━━━━━━━━━━━━━━━\n`;
            caption += `⬇️ *Downloading MOD APK...*`;

            // Send app icon + details
            if (app.icon) {
                await conn.sendMessage(
                    from,
                    {
                        image: { url: app.icon },
                        caption: caption
                    },
                    { quoted: mek }
                );
            } else {
                await conn.sendMessage(
                    from,
                    {
                        text: caption
                    },
                    { quoted: mek }
                );
            }

            // Download and send APK
            await conn.sendMessage(
                from,
                {
                    document: {
                        url: download.url
                    },
                    fileName:
                        download.fileName ||
                        `${app.title || "MODAPK"}.apk`,
                    mimetype:
                        "application/vnd.android.package-archive"
                },
                { quoted: mek }
            );

            await conn.sendMessage(from, {
                react: {
                    text: "✅",
                    key: mek.key
                }
            });

            // Clear saved search
            apkResults.delete(from);

        } catch (error) {
            console.error(
                "MODAPK Download Error:",
                error?.response?.data || error.message
            );

            apkResults.delete(from);

            await conn.sendMessage(from, {
                react: {
                    text: "❌",
                    key: mek.key
                }
            });

            return reply(
                "❌ *Failed to download the APK!*\n\n" +
                "The file may be too large or the download server may be unavailable."
            );
        }
    }
);
