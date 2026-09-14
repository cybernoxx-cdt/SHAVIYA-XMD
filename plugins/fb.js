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

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ───────── Reply Waiter (list + number reply දෙකම) ─────────
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

            const msgSender = msg.key.participant || msg.key.remoteJid;
            const isCorrectUser =
                msgSender.includes(sender.split('@')[0]) ||
                msgSender.includes("@lid");
            if (!isCorrectUser) return;

            const msgType = Object.keys(msg.message)[0];

            // ── List reply (listResponseMessage) ──
            if (msgType === "listResponseMessage") {
                const listReply = msg.message.listResponseMessage;
                const selectedId = listReply?.singleSelectReply?.selectedRowId;
                if (selectedId) {
                    return done({ msg, text: String(selectedId).trim() });
                }
            }

            // ── Native flow reply ──
            if (msgType === "interactiveResponseMessage") {
                try {
                    const nativeReply = msg.message.interactiveResponseMessage?.nativeFlowResponseMessage;
                    if (nativeReply) {
                        const parsed = JSON.parse(nativeReply.paramsJson || "{}");
                        const id = parsed.id || "";
                        if (id) return done({ msg, text: String(id).trim() });
                    }
                } catch {}
            }

            // ── Number reply (quoted text) ──
            const ctx =
                msg.message?.extendedTextMessage?.contextInfo;

            if (ctx?.stanzaId === targetId) {
                let text =
                    msg.message.conversation ||
                    msg.message?.extendedTextMessage?.text || "";
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

// ───────── Fetch ─────────
async function fetchFB(url) {
    const apiUrl = `${API_BASE}?url=${encodeURIComponent(url)}&apitoken=${API_TOKEN}`;
    const res = await axios.get(apiUrl, { timeout: 30000 });
    return res.data;
}

// ───────── Parse ─────────
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
      if (!query) return reply("❌ Please provide a Facebook link.");

      await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });
      console.log(`\x1b[36m[FB-LOG]\x1b[0m Fetching data from API...`);

      const data = await fetchFB(query);

      if (!data || data.Status !== true || !Array.isArray(data.Result) || data.Result.length === 0) {
        await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Video not found or link is private.");
      }

      const { videoHD, videoSD, audio } = parseResult(data.Result);

      if (!videoHD && !videoSD && !audio) {
        await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ No media available.");
      }

      // ═══════════════════════════════════════════════════
      //  BUILD LIST MENU (Dnuzi native list style)
      // ═══════════════════════════════════════════════════
      const rows = [];
      const options = [];

      if (videoHD) {
        rows.push({
          title: "📹 HD Video",
          description: `High quality · ${fmtSize(videoHD.Size)}`,
          rowId: "1"
        });
        options.push({ id: "1", action: "video", data: videoHD, label: "HD" });
      }
      if (videoSD) {
        rows.push({
          title: "📹 SD Video",
          description: `Standard quality · ${fmtSize(videoSD.Size)}`,
          rowId: "2"
        });
        options.push({ id: "2", action: "video", data: videoSD, label: "SD" });
      }
      if (videoHD || videoSD) {
        const bestSource = videoHD || videoSD;
        rows.push({
          title: "🎵 Audio (MP3)",
          description: "Extract as MP3 audio",
          rowId: "3"
        });
        options.push({ id: "3", action: "audio", data: bestSource, label: "MP3" });

        rows.push({
          title: "📁 Video as Document",
          description: `Full video file · ${fmtSize(bestSource.Size)}`,
          rowId: "4"
        });
        options.push({ id: "4", action: "videoDoc", data: bestSource, label: "VID-DOC" });

        rows.push({
          title: "📄 Audio as Document",
          description: "MP3 file (document)",
          rowId: "5"
        });
        options.push({ id: "5", action: "audioDoc", data: bestSource, label: "AUD-DOC" });
      }

      // ─────────────────────────────────────
      //  ✅ Dnuzi Native List Message
      // ─────────────────────────────────────
      const sentQual = await bot.sendMessage(from, {
        text: `🔵 *𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃 𝐅𝐁 𝐃𝐋*\n\n🎬 *Title:* Facebook Video\n\n👇 *Select download option below*`,
        footer: "𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃",
        title: "🔵 FB Downloader",
        buttonText: "📥 Select Option",
        sections: [
          {
            title: "🎬 Available Downloads",
            rows: rows
          }
        ]
      }, { quoted: mek });

      // Wait for user selection
      const selection = await waitForReply(bot, from, sender, sentQual.key.id);
      if (!selection) return;

      const choice = String(selection.text).replace(/[^\d]/g, "");
      const opt = options.find(o => o.id === choice);

      if (!opt) {
        await bot.sendMessage(from, { react: { text: "❌", key: selection.msg.key } });
        return reply("❌ Invalid choice.");
      }

      await bot.sendMessage(from, { react: { text: "📥", key: selection.msg.key } });

      // ── Execute ──
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
      reply(`❌ Error: ${err.message}`);
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
            caption: `*╰────────────────⊷*\n✅ *FB Download Complete*\n📦 Quality: ${quality}\n💾 Size: ${sizeMB} MB\n*╰────────────────⊷*\n\n𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃`
          }, { quoted: quotedMek });
          await conn.sendMessage(from, { react: { text: "✅", key: quotedMek.key } });
          if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        });

        writer.on("error", (e) => { console.error(e.message); reply("❌ Download failed."); });
      } catch (e) { console.error(e.message); reply("❌ Download failed."); }
    }

    // ══════════════════════════════════════════
    //  Video Doc
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
            fileName: `Facebook_Video_${quality}.mp4`,
            caption: `*╰────────────────⊷*\n📁 *FB Video (Document)*\n📦 Quality: ${quality}\n💾 Size: ${sizeMB} MB\n*╰────────────────⊷*\n\n𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃`
          }, { quoted: quotedMek });
          await conn.sendMessage(from, { react: { text: "✅", key: quotedMek.key } });
          if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        });

        writer.on("error", (e) => { console.error(e.message); reply("❌ Download failed."); });
      } catch (e) { console.error(e.message); reply("❌ Download failed."); }
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
            fileName: `Facebook_Audio.mp3`,
            caption: `*╰────────────────⊷*\n🎵 *FB Audio (Document)*\n💾 Size: ${sizeMB} MB\n*╰────────────────⊷*\n\n𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃`
          }, { quoted: quotedMek });
        } else {
          await conn.sendMessage(from, {
            audio: fs.readFileSync(audioFile),
            mimetype: "audio/mpeg",
            ptt: false
          }, { quoted: quotedMek });
          await conn.sendMessage(from, {
            text: `*╰────────────────⊷*\n🎵 *FB Audio*\n💾 Size: ${sizeMB} MB\n*╰────────────────⊷*\n\n𝐒𝐇𝐀𝐕𝐈𝐘𝐀-𝐗𝐌𝐃`
          }, { quoted: quotedMek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: quotedMek.key } });
      } catch (e) {
        console.error(e.message); reply("❌ Audio extraction failed.");
      } finally {
        if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
        if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
      }
    }
  }
);
