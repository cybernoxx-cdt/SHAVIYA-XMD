const { cmd } = require("../command");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");

// ══════════════════════════════════════════════════════════════
//  FACEBOOK DOWNLOADER — SHAVIYA-XMD
//  API: WhiteShadow X API · Dnuzi List Menu Style
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

const API_BASE = "https://whiteshadow-x-api.onrender.com/api/download/fb";
const API_TOKEN = "e76n2P";
const TEMP_DIR = path.resolve(__dirname, "../temp");
const DEBUG = false;

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ───────── Reply Waiter ─────────
function waitForReply(conn, from, sender, targetId) {
    return new Promise((resolve) => {
        let resolved = false;
        const done = (payload) => {
            if (resolved) return;
            resolved = true;
            conn.ev.off("messages.upsert", handler);
            resolve(payload);
        };
        const handler = (update) => {
            if (resolved) return;
            const msg = update.messages?.[0];
            if (!msg?.message) return;
            if (msg.key.remoteJid !== from) return;

            const msgKeys = Object.keys(msg.message);
            if (DEBUG) console.log('[FB-WAIT] Keys:', msgKeys.join(', '));

            // List reply
            if (msgKeys.includes('listResponseMessage')) {
                const listReply = msg.message.listResponseMessage;
                const selectedId = listReply?.singleSelectReply?.selectedRowId
                                || listReply?.singleSelectReply?.selectedRowID;
                if (selectedId) return done({ msg, text: String(selectedId).trim() });
            }

            // Interactive/Native
            if (msgKeys.includes('interactiveResponseMessage')) {
                try {
                    const inter = msg.message.interactiveResponseMessage;
                    const nativeReply = inter?.nativeFlowResponseMessage;
                    if (nativeReply) {
                        const parsed = JSON.parse(nativeReply.paramsJson || "{}");
                        const id = parsed.id || nativeReply.name || "";
                        if (id) return done({ msg, text: String(id).trim() });
                    }
                    const bodyText = inter?.body?.text;
                    if (bodyText) return done({ msg, text: String(bodyText).trim() });
                } catch (e) {}
            }

            // Button reply
            if (msgKeys.includes('buttonsResponseMessage')) {
                const btnId = msg.message.buttonsResponseMessage?.selectedButtonId;
                if (btnId) return done({ msg, text: String(btnId).trim() });
            }
            if (msgKeys.includes('templateButtonReplyMessage')) {
                const btnId = msg.message.templateButtonReplyMessage?.selectedId;
                if (btnId) return done({ msg, text: String(btnId).trim() });
            }

            // Number reply
            if (msgKeys.includes('extendedTextMessage')) {
                const ext = msg.message.extendedTextMessage;
                const ctx = ext?.contextInfo;
                if (ctx?.stanzaId === targetId) {
                    const text = ext?.text || "";
                    if (text) return done({ msg, text: text.trim() });
                }
            }
            if (msgKeys.includes('conversation')) {
                const text = msg.message.conversation;
                if (text) return done({ msg, text: text.trim() });
            }
        };
        conn.ev.on("messages.upsert", handler);
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                conn.ev.off("messages.upsert", handler);
            }
        }, 600000);
    });
}

// ───────── MP4 → MP3 ─────────
function convertToAudio(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputFile)
            .toFormat("mp3")
            .audioCodec("libmp3lame")
            .audioBitrate(192)
            .on("end", resolve)
            .on("error", reject)
            .save(outputFile);
    });
}

async function fetchFB(url) {
    const apiUrl = `${API_BASE}?url=${encodeURIComponent(url)}&apitoken=${API_TOKEN}`;
    const res = await axios.get(apiUrl, { timeout: 30000 });
    return res.data;
}

function parseResult(result) {
    if (!Array.isArray(result)) return { videoHD: null, videoSD: null, audio: null };
    let videoHD = null, videoSD = null, audio = null;
    for (const item of result) {
        const type = (item.Type || "").toLowerCase();
        const quality = (item.Quality || "").toUpperCase();
        if (type === "mp4") {
            if (quality === "HD" && !videoHD) videoHD = item;
            else if (quality === "SD" && !videoSD) videoSD = item;
            else if (!videoSD) videoSD = item;
        } else if (type === "m4a" || type === "mp3" || type === "audio") {
            if (!audio) audio = item;
        }
    }
    return { videoHD, videoSD, audio };
}

function fmtSize(sz) {
    if (!sz) return "?";
    return String(sz);
}

// ══════════════════════════════════════════════════════════════
//  🎨 BEAUTIFUL TEXT HELPERS
// ══════════════════════════════════════════════════════════════

function headerBlock() {
    return (
        `╭━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃   🔵  𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊  𝐃𝐋  🔵   ┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯`
    );
}

function loadingMsg() {
    return (
        `${headerBlock()}\n\n` +
        `⏳ *Fetching video details...*\n` +
        `_Please wait a moment_ 🕐`
    );
}

function successMsg({ quality, sizeMB, type }) {
    const icons = {
        video: '📹',
        videoDoc: '📁',
        audio: '🎵',
        audioDoc: '📄'
    };
    const titles = {
        video: 'Video Downloaded',
        videoDoc: 'Video as Document',
        audio: 'Audio Downloaded',
        audioDoc: 'Audio as Document'
    };
    const icon = icons[type] || '📦';
    const title = titles[type] || 'Download Complete';

    return (
        `╭━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃   ✅  𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃  𝐎𝐊   ┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `${icon} *${title}*\n\n` +
        `┣ 📦 *Quality:* ${quality}\n` +
        `┣ 💾 *Size:* ${sizeMB} MB\n` +
        `┣ 📅 *Date:* ${new Date().toLocaleDateString('en-GB')}\n` +
        `┣ ⏰ *Time:* ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}\n` +
        `┗ 🛡️ *Secured:* SHAVIYA-XMD\n\n` +
        `> 🌖 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐒𝐀𝐕𝐄𝐍𝐃𝐑𝐀 𝐃𝐀𝐌𝐏𝐑𝐈𝐘𝐀`
    );
}

function errorMsg(reason) {
    return (
        `╭━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃    ❌  𝐄𝐑𝐑𝐎𝐑   ❌    ┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `⚠️ *${reason}*\n\n` +
        `💡 _Please check the link and try again_`
    );
}

// ══════════════════════════════════════════════════════════════
//  MAIN COMMAND
// ══════════════════════════════════════════════════════════════
cmd(
  {
    pattern: "fb",
    alias: ["fbdl", "facebook"],
    ownerOnly: false,
    react: "🔵",
    desc: "FB Video Downloader",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply, sender, sessionId }) => {
    try {
      let query = typeof q === "string" ? q.trim() : "";
      if (!query) {
        return reply(
          `╭━━━━━━━━━━━━━━━━━━━━━━╮\n` +
          `┃   🔵  𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊  𝐃𝐋  🔵   ┃\n` +
          `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
          `⚠️ *Missing Link!*\n\n` +
          `📌 *Usage:*\n` +
          `   \`.fb <facebook-link>\`\n\n` +
          `💡 *Example:*\n` +
          `   \`.fb https://fb.watch/xxxxx\`\n\n` +
          `> 🌖 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐒𝐀𝐕𝐄𝐍𝐃𝐑𝐀 𝐃𝐀𝐌𝐏𝐑𝐈𝐘𝐀`
        );
      }

      await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      console.log(`\x1b[36m[FB-LOG]\x1b[0m Fetching data from API...`);

      const data = await fetchFB(query);

      if (!data || data.Status !== true || !Array.isArray(data.Result) || data.Result.length === 0) {
        await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(errorMsg("Video not found or link is private"));
      }

      const { videoHD, videoSD, audio } = parseResult(data.Result);

      if (!videoHD && !videoSD && !audio) {
        await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(errorMsg("No downloadable media available"));
      }

      // ═══════════════════════════════════════════════════
      //  BUILD LIST MENU
      // ═══════════════════════════════════════════════════
      const rows = [];
      const options = [];

      if (videoHD) {
        rows.push({
          title: "🎬 HD Video  ┃  High Quality",
          description: `📦 Size: ${fmtSize(videoHD.Size)}  •  Best quality`,
          rowId: "1"
        });
        options.push({ id: "1", action: "video", data: videoHD, label: "HD" });
      }
      if (videoSD) {
        rows.push({
          title: "🎞️ SD Video  ┃  Standard",
          description: `📦 Size: ${fmtSize(videoSD.Size)}  •  Fast download`,
          rowId: "2"
        });
        options.push({ id: "2", action: "video", data: videoSD, label: "SD" });
      }
      if (videoHD || videoSD) {
        const bestSource = videoHD || videoSD;

        rows.push({
          title: "🎵 Audio (MP3)",
          description: `🎧 Extract audio only  •  MP3 format`,
          rowId: "3"
        });
        options.push({ id: "3", action: "audio", data: bestSource, label: "MP3" });

        rows.push({
          title: "📁 Video as Document",
          description: `📄 Full video file  •  ${fmtSize(bestSource.Size)}`,
          rowId: "4"
        });
        options.push({ id: "4", action: "videoDoc", data: bestSource, label: "VID-DOC" });

        rows.push({
          title: "📄 Audio as Document",
          description: `🎼 MP3 as file  •  No compression`,
          rowId: "5"
        });
        options.push({ id: "5", action: "audioDoc", data: bestSource, label: "AUD-DOC" });
      }

      // ─────────────────────────────────────
      //  ✅ Beautiful List Menu
      // ─────────────────────────────────────
      const menuText =
        `╭━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃   🔵  𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊  𝐃𝐋  🔵   ┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `┣ 🎬 *Video Found!*\n` +
        `┣ 📊 *Options:* ${rows.length}\n` +
        `┣ 🟢 *Status:* Ready\n` +
        `┗ 🔒 *Secured:* SHAVIYA-XMD\n\n` +
        `╭━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  👇  *SELECT OPTION*  👇  ┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `_Tap the button below_ ✨\n\n` +
        `> 🌖 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐒𝐀𝐕𝐄𝐍𝐃𝐑𝐀 𝐃𝐀𝐌𝐏𝐑𝐈𝐘𝐀`;

      const sentQual = await bot.sendMessage(from, {
        text: menuText,
        footer: "🌖 𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃",
        title: "🔵 Facebook Downloader",
        buttonText: "📥  𝐒𝐄𝐋𝐄𝐂𝐓  𝐎𝐏𝐓𝐈𝐎𝐍  📥",
        sections: [
          {
            title: "━━━  🎬  𝐀𝐕𝐀𝐈𝐋𝐀𝐁𝐋𝐄  𝐎𝐏𝐓𝐈𝐎𝐍𝐒  ━━━",
            rows: rows
          }
        ]
      }, { quoted: mek });

      if (DEBUG) console.log('[FB] List sent, waiting for reply...');

      const selection = await waitForReply(bot, from, sender, sentQual.key.id);
      if (!selection) {
        if (DEBUG) console.log('[FB] Timeout — no reply');
        return;
      }

      if (DEBUG) console.log('[FB] Selection received:', selection.text);

      const choice = String(selection.text).replace(/[^\d]/g, "");
      const opt = options.find(o => o.id === choice);

      if (!opt) {
        await bot.sendMessage(from, { react: { text: "❌", key: selection.msg.key } });
        return reply(errorMsg("Invalid option selected"));
      }

      await bot.sendMessage(from, { react: { text: "📥", key: selection.msg.key } });

      // ── Execute per option ──
      if (opt.action === "video") {
        console.log(`\x1b[32m[FB-LOG]\x1b[0m Downloading ${opt.label} video...`);
        await handleVideoSend(bot, from, opt.data.Url, opt.label, selection.msg, reply);

      } else if (opt.action === "audio") {
        console.log(`\x1b[32m[FB-LOG]\x1b[0m Extracting audio...`);
        await handleAudioSend(bot, from, opt.data.Url, selection.msg, false, reply);

      } else if (opt.action === "videoDoc") {
        console.log(`\x1b[32m[FB-LOG]\x1b[0m Sending video as document...`);
        await handleVideoDoc(bot, from, opt.data.Url, opt.label, selection.msg, reply);

      } else if (opt.action === "audioDoc") {
        console.log(`\x1b[32m[FB-LOG]\x1b[0m Sending audio as document...`);
        await handleAudioSend(bot, from, opt.data.Url, selection.msg, true, reply);
      }

    } catch (err) {
      console.error(`\x1b[31m[FB-ERROR]\x1b[0m`, err.message);
      reply(errorMsg(err.message));
    }

    // ══════════════════════════════════════════
    //  Video Send
    // ══════════════════════════════════════════
    async function handleVideoSend(conn, from, dlUrl, quality, quotedMek, reply) {
      const outputFile = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`);
      try {
        const response = await axios({ method: "get", url: dlUrl, responseType: "stream", timeout: 120000 });
        const writer = fs.createWriteStream(outputFile);
        response.data.pipe(writer);

        writer.on("finish", async () => {
          const sizeMB = (fs.statSync(outputFile).size / 1048576).toFixed(2);

          await conn.sendMessage(from, {
            video: fs.readFileSync(outputFile),
            mimetype: "video/mp4",
            caption: successMsg({ quality, sizeMB, type: 'video' })
          }, { quoted: quotedMek });

          await conn.sendMessage(from, { react: { text: "✅", key: quotedMek.key } });
          console.log(`\x1b[32m[FB-LOG]\x1b[0m Video sent. Size: ${sizeMB}MB`);
          if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        });

        writer.on("error", (e) => { console.error(e.message); reply(errorMsg("Download failed")); });
      } catch (e) {
        console.error(e.message);
        reply(errorMsg("Download failed"));
      }
    }

    // ══════════════════════════════════════════
    //  Video as Document
    // ══════════════════════════════════════════
    async function handleVideoDoc(conn, from, dlUrl, quality, quotedMek, reply) {
      const outputFile = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`);
      try {
        const response = await axios({ method: "get", url: dlUrl, responseType: "stream", timeout: 120000 });
        const writer = fs.createWriteStream(outputFile);
        response.data.pipe(writer);

        writer.on("finish", async () => {
          const sizeMB = (fs.statSync(outputFile).size / 1048576).toFixed(2);

          await conn.sendMessage(from, {
            document: fs.readFileSync(outputFile),
            mimetype: "video/mp4",
            fileName: `𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃_${quality}.mp4`,
            caption: successMsg({ quality, sizeMB, type: 'videoDoc' })
          }, { quoted: quotedMek });

          await conn.sendMessage(from, { react: { text: "✅", key: quotedMek.key } });
          console.log(`\x1b[32m[FB-LOG]\x1b[0m Video doc sent. Size: ${sizeMB}MB`);
          if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        });

        writer.on("error", (e) => { console.error(e.message); reply(errorMsg("Download failed")); });
      } catch (e) {
        console.error(e.message);
        reply(errorMsg("Download failed"));
      }
    }

    // ══════════════════════════════════════════
    //  Audio Send
    // ══════════════════════════════════════════
    async function handleAudioSend(conn, from, dlUrl, quotedMek, asDoc, reply) {
      const videoFile = path.join(TEMP_DIR, `fb_vid_${Date.now()}.mp4`);
      const audioFile = path.join(TEMP_DIR, `fb_aud_${Date.now()}.mp3`);
      try {
        const response = await axios({ method: "get", url: dlUrl, responseType: "stream", timeout: 120000 });
        const writer = fs.createWriteStream(videoFile);
        response.data.pipe(writer);

        await new Promise((res, rej) => {
          writer.on("finish", res);
          writer.on("error", rej);
        });

        await convertToAudio(videoFile, audioFile);
        const sizeMB = (fs.statSync(audioFile).size / 1048576).toFixed(2);

        if (asDoc) {
          await conn.sendMessage(from, {
            document: fs.readFileSync(audioFile),
            mimetype: "audio/mpeg",
            fileName: `𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃_Audio.mp3`,
            caption: successMsg({ quality: "MP3", sizeMB, type: 'audioDoc' })
          }, { quoted: quotedMek });
        } else {
          await conn.sendMessage(from, {
            audio: fs.readFileSync(audioFile),
            mimetype: "audio/mpeg",
            ptt: false
          }, { quoted: quotedMek });

          await conn.sendMessage(from, {
            text: successMsg({ quality: "MP3", sizeMB, type: 'audio' })
          }, { quoted: quotedMek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: quotedMek.key } });
        console.log(`\x1b[32m[FB-LOG]\x1b[0m Audio sent${asDoc ? " as doc" : ""}. Size: ${sizeMB}MB`);

      } catch (e) {
        console.error(`\x1b[31m[FB-AUDIO-ERROR]\x1b[0m`, e.message);
        reply(errorMsg("Audio extraction failed"));
      } finally {
        if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
        if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
      }
    }
  }
);
