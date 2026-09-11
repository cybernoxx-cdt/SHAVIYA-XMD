// ============================================================
//  menu2.js — SHAVIYA-XMD Interactive HTML Menu
//  10 categories with unique colors + Games + AI Chat
// ============================================================

const { cmd } = require('../command');

let baileys;
try { baileys = require('@whiskeysockets/baileys'); }
catch (err) {
    try { baileys = require('@adiwajshing/baileys'); }
    catch (err) {
        try { baileys = require('baileys'); }
        catch (e) { console.error("Baileys module not found!"); }
    }
}
const { generateWAMessageFromContent } = baileys;

// ══════════════════════════════════════════════════════════════
//  CATEGORY DATA — 10 categories with unique colors
// ══════════════════════════════════════════════════════════════
const CATEGORIES = {
    download: {
        icon: '📥', label: 'ᴅᴏᴡɴʟᴏᴀᴅᴇʀs',
        color: '#3b82f6', dark: '#1e3a8a', light: '#93c5fd',
        commands: [
            { p: '.apk',       d: 'Search and download APK' },
            { p: '.fb',        d: 'FB Video Downloader' },
            { p: '.gdrive',    d: 'Google Drive files or folders (folder → ZIP)' },
            { p: '.mediafire', d: 'Download MediaFire files' },
            { p: '.mega',      d: 'MEGA ultra-fast download' },
            { p: '.megaget',   d: 'Specific file from MEGA folder' },
            { p: '.megalist',  d: 'List files inside a MEGA folder' },
            { p: '.song',      d: 'YouTube Song Downloader' },
            { p: '.song2',     d: 'YouTube Song Downloader V2' },
            { p: '.tiktok',    d: 'HD/SD TikTok Downloader' },
            { p: '.twitter',   d: 'Download Twitter videos' },
            { p: '.yt',        d: 'YouTube videos/audio by name/link' },
            { p: '.yt2',       d: 'YouTube multiple qualities' }
        ]
    },
    movie: {
        icon: '🎬', label: 'ᴍᴏᴠɪᴇ & ᴀɴɪᴍᴇ',
        color: '#ef4444', dark: '#7f1d1d', light: '#fca5a5',
        commands: [
            { p: '.anime',          d: 'SL Anime Club Downloader | 0 = All Episodes' },
            { p: '.cartoonlatest',  d: 'SinhalaCartoons.com Latest Uploads' },
            { p: '.cmovie',         d: 'Movies & TV series from CineSubz' },
            { p: '.cz',             d: 'CineSubz downloader' },
            { p: '.dinka',          d: 'Drive File + Other Link Only Hybrid' },
            { p: '.movie',          d: 'Ultimate Multi-reply movie engine' },
            { p: '.sinhalacartoon', d: 'SinhalaCartoons.com Search/Latest' },
            { p: '.sinhalasubw',    d: 'SinhalaSub.lk Search/Details/Download' },
            { p: '.slcartoon',      d: 'Sinhala Cartoon downloader' }
        ]
    },
    ai: {
        icon: '🧠', label: 'ᴀɪ & ꜰᴜɴ',
        color: '#a855f7', dark: '#581c87', light: '#d8b4fe',
        commands: [
            { p: '.deepseek', d: 'DeepSeek AI' },
            { p: '.pupilmv',  d: 'Search Sinhala subbed movies' },
            { p: '.sumi',     d: 'AI Girlfriend — chat with Sumi 💕' },
            { p: '.text2img', d: 'Generate AI Images' },
            { p: '.vchange',  d: 'Change voice note (alvin/hulk/robot/baby)' },
            { p: '.wormgpt',  d: 'AI Chat Bot — ask anything 🤖' }
        ]
    },
    sticker: {
        icon: '🎭', label: 'sᴛɪᴄᴋᴇʀ & ᴍᴇᴅɪᴀ',
        color: '#ec4899', dark: '#831843', light: '#f9a8d4',
        commands: [
            { p: '.aya',     d: 'Convert image/video to animated sticker' },
            { p: '.convert', d: 'Convert sticker to image' },
            { p: '.sticker', d: 'Create sticker from image/video' },
            { p: '.take',    d: 'Create sticker with custom pack name' }
        ]
    },
    tools: {
        icon: '🛠️', label: 'ᴛᴏᴏʟs & ᴜᴛɪʟɪᴛʏ',
        color: '#06b6d4', dark: '#155e75', light: '#67e8f9',
        commands: [
            { p: '.batchupload', d: 'Upload multiple files at once (Max 5)' },
            { p: '.fetch',       d: 'Fetch data from a URL or API' },
            { p: '.fileinfo',    d: 'Get detailed info about a file' },
            { p: '.imgbb',       d: 'Upload images to ImgBB' },
            { p: '.lyrics',      d: 'Get song lyrics' },
            { p: '.npm',         d: 'Search a package on npm' },
            { p: '.qr',          d: 'Generate QR code from text/link' },
            { p: '.qrscan',      d: 'Scan/Read QR code from image' },
            { p: '.sinhala',     d: 'සිංහල Text to Voice Note' },
            { p: '.tomp3',       d: 'Convert media to audio' },
            { p: '.toptt',       d: 'Convert media to voice message' },
            { p: '.ts2',         d: 'TikTok videos search' },
            { p: '.tts',         d: 'Text to Speech voice note' },
            { p: '.tts2',        d: 'English Text to Voice Note' },
            { p: '.vv',          d: 'Open view-once message' },
            { p: '.vv2',         d: 'Retrieve view-once message' },
            { p: '.xxx',         d: 'Adult content downloader (18+)' }
        ]
    },
    news: {
        icon: '📰', label: 'ɴᴇᴡs',
        color: '#f59e0b', dark: '#92400e', light: '#fcd34d',
        commands: [
            { p: '.bbc',   d: 'Latest BBC Sinhala News' },
            { p: '.news3', d: 'Get latest Sirasa news' }
        ]
    },
    group: {
        icon: '👥', label: 'ɢʀᴏᴜᴘ ᴍɢᴍᴛ',
        color: '#10b981', dark: '#065f46', light: '#6ee7b7',
        commands: [
            { p: '.add',        d: 'Add a member to the group' },
            { p: '.antilink',   d: 'Anti-link protection on/off' },
            { p: '.anticall',   d: 'Block incoming calls' },
            { p: '.cancelkick', d: 'Stop running kickall' },
            { p: '.demote',     d: 'Demote admin to member' },
            { p: '.gid',        d: 'Get group info from invite link' },
            { p: '.gst',        d: 'Send text/media status to group' },
            { p: '.hidetag',    d: 'Tag all Members silently' },
            { p: '.kick',       d: 'Remove a member from group' },
            { p: '.kickall',    d: 'Remove ALL members instantly' },
            { p: '.kickstatus', d: 'Live kickall progress' },
            { p: '.mention',    d: 'Mention all group members' },
            { p: '.msg',        d: 'Send message multiple times' },
            { p: '.mute',       d: 'Lock group' },
            { p: '.promote',    d: 'Promote member to admin' },
            { p: '.unmute',     d: 'Unlock group' }
        ]
    },
    owner: {
        icon: '⚙️', label: 'ᴏᴡɴᴇʀ & sᴇᴛᴛɪɴɢs',
        color: '#64748b', dark: '#334155', light: '#cbd5e1',
        commands: [
            { p: '.addpremium',    d: 'Add premium user' },
            { p: '.alwaysoffline', d: 'Bot always offline mode' },
            { p: '.antidelete',    d: 'Toggle anti-delete messages' },
            { p: '.autolike',      d: 'Auto react to statuses' },
            { p: '.autostatus',    d: 'Auto status view' },
            { p: '.autovoice',     d: 'Auto Voice + Sticker + Reply' },
            { p: '.autovv',        d: 'Auto view-once capture ON/OFF' },
            { p: '.ban',           d: 'Ban a user' },
            { p: '.block',         d: 'Blocks a person' },
            { p: '.botinfo',       d: 'Show full bot configuration' },
            { p: '.button',        d: 'Toggle button mode' },
            { p: '.creact',        d: 'Multi-Node Mass Reaction' },
            { p: '.delsudo',       d: 'Remove temporary owner' },
            { p: '.forward',       d: 'Forward replied message' },
            { p: '.forwardoff',    d: 'Disable auto-forward' },
            { p: '.forwardon',     d: 'Enable auto-forward' },
            { p: '.fulldp',        d: 'Set FULL profile picture' },
            { p: '.fwd2',          d: 'Forward to up to 20 JIDs' },
            { p: '.fwdstatus',     d: 'Show forward configuration' },
            { p: '.getpp',         d: 'Send profile picture by number' },
            { p: '.listpremium',   d: 'List premium users' },
            { p: '.listsudo',      d: 'List all temporary owners' },
            { p: '.ownermenu',     d: 'Owner control panel' },
            { p: '.pair',          d: 'Get pairing code' },
            { p: '.plugin',        d: 'Toggle a plugin ON/OFF' },
            { p: '.plugins',       d: 'Show all plugins' },
            { p: '.removepremium', d: 'Remove premium user' },
            { p: '.resetbot',      d: 'Reset all settings' },
            { p: '.restart',       d: 'Restart bot with GIF' },
            { p: '.set',           d: 'Quick toggle by key' },
            { p: '.setfname',      d: 'Set file name prefix' },
            { p: '.setfooter',     d: 'Set bot footer name' },
            { p: '.setforward',    d: 'Set auto-forward destination' },
            { p: '.setmode',       d: 'Bot access mode set' },
            { p: '.setprefix',     d: 'Set document caption prefix' },
            { p: '.setsudo',       d: 'Add temporary owner' },
            { p: '.setthumb',      d: 'Set default thumbnail URL' },
            { p: '.settings',      d: 'Interactive settings menu' },
            { p: '.toggle',        d: 'Toggle feature by number' },
            { p: '.unban',         d: 'Unban a user' },
            { p: '.unblock',       d: 'Unblocks a person' },
            { p: '.update',        d: 'Redeploy bot from GitHub' }
        ]
    },
    system: {
        icon: '⚡', label: 'sʏsᴛᴇᴍ & ᴍᴀɪɴ',
        color: '#6366f1', dark: '#312e81', light: '#a5b4fc',
        commands: [
            { p: '.alive',  d: 'Check bot online status' },
            { p: '.menu',   d: 'WhiteShadow interactive menu' },
            { p: '.menu2',  d: 'This HTML menu' },
            { p: '.owner',  d: 'Get owner contact details' },
            { p: '.system', d: 'Show bot system statistics' }
        ]
    },
    games: {
        icon: '🎮', label: 'ɢᴀᴍᴇs',
        color: '#84cc16', dark: '#3f6212', light: '#d9f99d',
        commands: [
            { p: '.chess',  d: '♟️ Chess Game — play vs AI or 2 players' },
            { p: '.car',    d: '🏎️ Highway Rush — dodge traffic, collect coins' },
            { p: '.dino',   d: '🦖 Chrome Dino — jump cacti, duck birds' },
            { p: '.flappy', d: '🐦 Flappy Bird — tap to flap through pipes' },
            { p: '.galaxy', d: '👾 Galaxy Attack — space shooter with boss fights' }
        ]
    }
};

const TOTAL = Object.values(CATEGORIES).reduce((a, c) => a + c.commands.length, 0);
const OWNER_NAME = 'Savendra Dampriya';

// ══════════════════════════════════════════════════════════════
//  .menu2 command
// ══════════════════════════════════════════════════════════════
cmd({
    pattern:  'menu2',
    alias:    ['hmen', 'htmlmenu', 'uimenu', 'newmenu'],
    desc:     'Interactive HTML menu with colored categories',
    category: 'main',
    react:    '🎨',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '🎨', key: mek.key }
        });

        const userName = m.pushName || 'User';
        const now = new Date();
        const timeStr = now.toLocaleString('en-US', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        const categoriesJson = JSON.stringify(CATEGORIES);

        const gameHtml = `<style>
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; touch-action: none; overflow: hidden; }
.wrapper { width: 100%; max-width: 480px; margin: auto; padding: 12px; }
.header { text-align: center; margin-bottom: 12px; padding: 12px; background: linear-gradient(180deg, rgba(15,18,26,0.97), rgba(10,12,18,0.97)); border: 2px solid #1e293b; border-radius: 14px; }
.header .dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981; animation: pulse 1.4s infinite; margin-right: 6px; vertical-align: middle; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
.header h1 { font-size: 17px; font-weight: 900; color: #fff; letter-spacing: 2px; text-transform: uppercase; }
.header h1 span { color: #3b82f6; text-shadow: 0 0 12px rgba(59,130,246,0.6); }
.header .sub { font-size: 10px; color: #94a3b8; margin-top: 4px; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; }
.header .info-row { display:flex; justify-content: space-around; margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); }
.header .info-item .lbl{ font-size:8px; color:#64748b; letter-spacing:1px; font-weight:700; text-transform:uppercase; }
.header .info-item .val{ font-size:11px; color:#fff; font-weight:800; margin-top: 2px; }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cat-card { position: relative; padding: 14px 10px; border-radius: 14px; text-align: center; cursor: pointer; border: 2px solid; background: rgba(15,18,26,0.95); overflow: hidden; transition: transform 0.15s, box-shadow 0.2s; }
.cat-card:active { transform: scale(0.94); }
.cat-card .icon { font-size: 26px; margin-bottom: 6px; display: block; }
.cat-card .label { font-size: 11px; font-weight: 900; letter-spacing: 0.5px; color: #fff; text-transform: uppercase; }
.cat-card .count { font-size: 9px; margin-top: 5px; font-weight: 800; letter-spacing: 1px; padding: 2px 6px; border-radius: 6px; display: inline-block; }
.cat-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.4)); pointer-events: none; }

.sub-view { display: none; }
.sub-view.active { display: block; }
.back-btn { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; margin-bottom: 10px; font-weight: 800; font-size: 13px; cursor: pointer; border: 2px solid; background: rgba(15,18,26,0.95); transition: transform 0.15s; }
.back-btn:active { transform: scale(0.95); }
.sub-title { text-align: center; padding: 12px; border-radius: 14px; margin-bottom: 10px; border: 2px solid; background: rgba(15,18,26,0.97); }
.sub-title .icon { font-size: 30px; margin-bottom: 4px; }
.sub-title .label { font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
.sub-title .cnt { font-size: 10px; color: #94a3b8; margin-top: 4px; font-weight: 700; letter-spacing: 1px; }

.cmd-list { display: flex; flex-direction: column; gap: 8px; }
.cmd-item { padding: 10px 12px; border-radius: 12px; border: 2px solid; background: rgba(15,18,26,0.95); cursor: pointer; position: relative; transition: transform 0.15s; }
.cmd-item:active { transform: scale(0.97); }
.cmd-item .p-name { font-size: 13px; font-weight: 900; color: #fff; letter-spacing: 0.5px; margin-bottom: 3px; }
.cmd-item .p-desc { font-size: 10px; color: #94a3b8; font-weight: 600; line-height: 1.4; padding-right: 60px; }
.cmd-item .p-copy { position: absolute; top: 8px; right: 10px; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
.cmd-item.copied { background: rgba(16,185,129,0.15) !important; }

.credit-bar { margin-top: 14px; text-align: center; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; color: #94a3b8; text-transform: uppercase; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 8px; }
.credit-bar span { color: #3b82f6; text-shadow: 0 0 10px rgba(59,130,246,0.5); }
</style>
<body>
<div class="wrapper">
  <div class="header">
    <h1><span class="dot"></span><span>Sʜᴀᴠɪʏᴀ Xᴍᴅ</span></h1>
    <div class="sub">Interactive Menu · Tap a category</div>
    <div class="info-row">
      <div class="info-item"><div class="lbl">User</div><div class="val">${userName}</div></div>
      <div class="info-item"><div class="lbl">Time</div><div class="val">${timeStr}</div></div>
      <div class="info-item"><div class="lbl">Total</div><div class="val">${TOTAL} cmds</div></div>
    </div>
  </div>

  <div id="mainView">
    <div class="grid" id="catGrid"></div>
  </div>

  <div id="subView" class="sub-view">
    <div class="back-btn" id="backBtn">
      <span>◀</span><span>BACK TO CATEGORIES</span>
    </div>
    <div class="sub-title" id="subTitle"></div>
    <div class="cmd-list" id="cmdList"></div>
  </div>

  <div class="credit-bar">Engineered by <span>SAVENDRA DAMPRiya</span> ⚡</div>
</div>

<script>
var CATEGORIES = ${categoriesJson};

var mainView = document.getElementById('mainView');
var subView = document.getElementById('subView');
var catGrid = document.getElementById('catGrid');
var subTitle = document.getElementById('subTitle');
var cmdList = document.getElementById('cmdList');
var backBtn = document.getElementById('backBtn');

function buildMain() {
  catGrid.innerHTML = '';
  var keys = Object.keys(CATEGORIES);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var c = CATEGORIES[k];
    var card = document.createElement('div');
    card.className = 'cat-card';
    card.style.borderColor = c.color;
    card.style.boxShadow = '0 4px 20px ' + c.dark + '88, inset 0 0 30px ' + c.dark + '44';
    card.innerHTML =
      '<span class="icon">' + c.icon + '</span>' +
      '<div class="label" style="color:' + c.light + '">' + c.label + '</div>' +
      '<div class="count" style="background:' + c.dark + '; color:' + c.light + '">' + c.commands.length + ' cmds</div>';
    (function(key) {
      card.addEventListener('pointerdown', function(e) { e.preventDefault(); openCat(key); });
      card.addEventListener('touchstart', function(e) { e.preventDefault(); openCat(key); });
    })(k);
    catGrid.appendChild(card);
  }
}

function openCat(key) {
  var c = CATEGORIES[key];
  if (!c) return;

  subTitle.style.borderColor = c.color;
  subTitle.style.boxShadow = '0 4px 20px ' + c.dark + '88, inset 0 0 30px ' + c.dark + '44';
  subTitle.innerHTML =
    '<div class="icon">' + c.icon + '</div>' +
    '<div class="label" style="color:' + c.light + '">' + c.label + '</div>' +
    '<div class="cnt">' + c.commands.length + ' commands available</div>';

  backBtn.style.borderColor = c.color;
  backBtn.style.color = c.light;

  cmdList.innerHTML = '';
  for (var i = 0; i < c.commands.length; i++) {
    var cmd = c.commands[i];
    var item = document.createElement('div');
    item.className = 'cmd-item';
    item.style.borderColor = c.color + '66';
    item.innerHTML =
      '<div class="p-name" style="color:' + c.light + '">' + cmd.p + '</div>' +
      '<div class="p-desc">' + cmd.d + '</div>' +
      '<div class="p-copy" style="color:' + c.color + '">tap to copy</div>';
    (function(command, el, color) {
      var tapped = false;
      var doCopy = function(e) {
        e.preventDefault();
        if (tapped) return;
        tapped = true;
        try {
          if (navigator.clipboard) navigator.clipboard.writeText(command);
        } catch(err) {}
        el.classList.add('copied');
        var copyEl = el.querySelector('.p-copy');
        var old = copyEl.innerText;
        copyEl.innerText = '✓ COPIED';
        copyEl.style.color = '#10b981';
        setTimeout(function() {
          copyEl.innerText = old;
          copyEl.style.color = color;
          el.classList.remove('copied');
          tapped = false;
        }, 900);
      };
      el.addEventListener('pointerdown', doCopy);
      el.addEventListener('touchstart', doCopy);
    })(cmd.p, item, c.color);
    cmdList.appendChild(item);
  }

  mainView.style.display = 'none';
  subView.classList.add('active');
}

function goBack(e) {
  if (e) e.preventDefault();
  subView.classList.remove('active');
  mainView.style.display = 'block';
}

backBtn.addEventListener('pointerdown', goBack);
backBtn.addEventListener('touchstart', goBack);

buildMain();
</script>
</body>
</html>`;

        const unifiedData = Buffer.from(JSON.stringify({
            "response_id": "4db57b2c-8393-484d-8b9a-8e6d1a14b349",
            "sections": [
                {
                    "view_model": {
                        "primitive": {
                            "__typename": "GenAIaeacdsnwHtmlPrimitive",
                            "payload": gameHtml,
                            "trusted_sources": [
                                "thenuxofc.store",
                                "nixel.dev"
                            ]
                        },
                        "__typename": "GenAISingleLayoutViewModel"
                    }
                }
            ]
        })).toString('base64');

        let buttonMessage = generateWAMessageFromContent(from, {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [{ messageType: 2, messageText: "Command Menu 🎨" }],
                        unifiedResponse: { data: unifiedData },
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedAiBotMessageInfo: {
                                botJid: "867051314767696@bot"
                            },
                            forwardOrigin: 4
                        }
                    }
                }
            }
        }, { quoted: mek });

        buttonMessage.message.messageContextInfo = {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
            botMetadata: {
                messageDisclaimerText: "",
                botResponseId: "b2e40280-433c-45d8-9c1a-270bec558860",
                verificationMetadata: {
                    proofs: [
                        {
                            version: 1,
                            useCase: 1,
                            signature: "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LVZlcmlmaWNhdGlvblNpZ25hdHVyZS5NZXRhZGF0YeN55YRyad2+ZA==",
                            certificateChain: [
                                "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGEOvtJr968bbpKdZreOTwkk9aPN++XPE60RfuzNLkXXc7LE8BOkJOWRpo2oNXaRJ3uCNJ43HY3A+oetnvHSfcxWqmvvTSrBOI5V1NOD6RMsZ/st1XVPUx83AGps1l5jYBOYzqMNy6un2tToJ2Bt9bXRo29tWLZTu8m7TNY/hISwVpVc5tjSet5U7btPN+dMIx2UvykB1jcbWGsdklheeuz8RXSStNXzeaGvsf1lpZ/ugLE4b2BdmlRNKrY6zLE4qFtRYQoS7axOyQX+4QUyN2m9bfm7urQmn+QRSXJwMO7X5kAJJLbkVGJFt9Pm9VXPwQVrK2aaqiXlpusj+7DfDw00OULmYMmZDTqXM0nUVLxj13z0LhMQoQhhNG8utdUn4uKOFceliTZ/xiP+A54GnX9620641bqw3ctfh9NNXPsTEK8hAUD7FDqUhVntHmoEYYEHq8X1tHHZYP49/f2iezTiE8AUaoZo42/jIWQIKohOGNUib2hEqMkW8NsR8vPihvNuqPc0zKZcl6359YFQdjiiW8kCRD/rsDOr9v1eYLFZKYloFyzFqEgj+jcG/V47elOjShJ5CCPwatXwP6HIloVwtgygFsnOFmCg6Ojoivfoz8Nw1qxFwg5OU2cq/1WbWNELKnaFg4eUWCAIJ/3ZIJsEPkgemZxGhE+hdiNn9dkQYBJs1kx2BxdIkJmQ9vJSKkrMz6lTxZM3IJ9mhmKS6zYdU1ppeAao0/ayte997DQParb/AHLN79g0iW1ad0z8ir5jAl0q3a+UZPTSa4YiSqC2PZ/gfxG5wvL2mKmeKowG0RXjmEp5iNxrni+T/HRLZOoH7y0DQ24nMCPg",
                                "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGHsL0Ccm0ELINFZ2IaBhKaeWnVuh0o6nZLCioCn9xpSADzwIS5VCWO+1eVXT2atJOyf7FYlpB0/JA3Us+aQtekuIkHu/zBXijORZ4ClF4+sF3cSTNg6gY/+6iwLK/zs3bMg+GeJrcI65vXfs95Shxlb2Rd5GRT2/2yBmR6Zkf5QwMJuptUHWtM26WY7/xlkEKGFYDZVqOSylusiOzSALa815zC6dCiHoJNLBEKMlaZZQOk57/+OYoU5zzTaEgLhyvNFHSyAlyLQ3SGFtVHAaJZHSmmSPyJowCOB+92Gkk6SWVMsk6FbU8QJWFtlhzV/W/gZ7WzUlS/AKgN0th9/cq20ToFkW7X9c+rtYavufmuieqFhXgaMD8AGsoN9QC/HzNC9D1nydPfFYEUr9BHVy2nF5gM58Y59r2rT8p5LPARIkUp8g+5DLhyW0tdZFZ1305o4AHCayZnp5rjcU2Xi/c1Qf/djBGakmijlMs4aMzKJYD0c4Q8jdI7sNyd876K2wRD+L6KeD2QB3PtCS4P7BWAl5gh5CJ6ZBrwcaKXZqcSjEwm52MqVCgYZdapAaNYUy/QndttjLOG0wxxwuX1hIhMjPnIKZR1kwnqD5EqlHpilrnojRZvjVGN4zEKmilS8rNstt4HHs/D849W+Q6LRVWiWMs0cT2IugrX+Skxd8En7Gq52UEmuVBrSTpN+UpIu20NsVb9lsvuYh3XO441606tOEY2eKcZJdTtqrOTNqbbTk0zVn1yhbOCvmfctBNDhTwaC5QMi0P9wjU5XI9SBtkdQLizc5oqpoiHeqgb8+aJHVLcbgIJ/KLZKtRWFDfzRNM02Csx4etUUapVd2NA/L0oMs/O5T9sVj9FBJ7q99GWr3PVmxJb36mHZLXC4k1gGN9swE0LtzYsUdT5tUo9ri/hS3W/SM+F1p4Kh4QIgRcG3ciIHGN44bnDh3HDCz0fDnzKYw0bclMxZPctEyJ5gEOPF6OAkjD9dEaRGq/tEPf1k9Aub+v2dEjnfrYWAm4E5Zfhs2Xh0CT0k+SzhgKd0K/46ChJ20G5+blwpIvahvTVS68+aVIX6CwXs4tcVx6FnmVsMOOkIasfaqQLZYbNBkuLoZnQAq4j8yRekrQ=="
                            ]
                        }
                    ]
                }
            }
        };

        await conn.relayMessage(from, buttonMessage.message, {
            messageId: buttonMessage.key.id
        });

    } catch (err) {
        console.error('Menu2 Send Error:', err);
        return reply('❌ Menu2 load error: ' + err.message);
    }
});
