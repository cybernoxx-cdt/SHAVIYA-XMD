// ============================================================
//  menu2.js — SHAVIYA-XMD Interactive HTML Menu
//  Pre-rendered categories · Bug-free · Animated copy
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

const CATEGORIES = {
    download: {
        icon: '📥', label: 'Downloads',
        color: '#3b82f6', dark: '#1e3a8a', light: '#93c5fd',
        commands: [
            { p: '.apk',       d: 'Search and download APK' },
            { p: '.fb',        d: 'FB Video Downloader' },
            { p: '.gdrive',    d: 'Google Drive downloader' },
            { p: '.mediafire', d: 'MediaFire files' },
            { p: '.mega',      d: 'MEGA download' },
            { p: '.megaget',   d: 'MEGA specific file' },
            { p: '.megalist',  d: 'List MEGA folder' },
            { p: '.song',      d: 'YouTube Song' },
            { p: '.song2',     d: 'YouTube Song V2' },
            { p: '.tiktok',    d: 'TikTok Downloader' },
            { p: '.twitter',   d: 'Twitter videos' },
            { p: '.yt',        d: 'YouTube downloader' },
            { p: '.yt2',       d: 'YouTube multiple quality' }
        ]
    },
    movie: {
        icon: '🎬', label: 'Movie & Anime',
        color: '#ef4444', dark: '#7f1d1d', light: '#fca5a5',
        commands: [
            { p: '.anime',          d: 'SL Anime Club' },
            { p: '.cartoonlatest',  d: 'SinhalaCartoons latest' },
            { p: '.cmovie',         d: 'CineSubz movies' },
            { p: '.cz',             d: 'CineSubz downloader' },
            { p: '.dinka',          d: 'Drive hybrid' },
            { p: '.movie',          d: 'Multi-reply movie engine' },
            { p: '.sinhalacartoon', d: 'SinhalaCartoons search' },
            { p: '.sinhalasubw',    d: 'SinhalaSub.lk' },
            { p: '.slcartoon',      d: 'Sinhala Cartoon' }
        ]
    },
    ai: {
        icon: '🧠', label: 'AI & Fun',
        color: '#a855f7', dark: '#581c87', light: '#d8b4fe',
        commands: [
            { p: '.deepseek', d: 'DeepSeek AI' },
            { p: '.pupilmv',  d: 'Pupil movie search' },
            { p: '.sumi',     d: 'AI Girlfriend 💕' },
            { p: '.text2img', d: 'AI image generator' },
            { p: '.vchange',  d: 'Voice changer' },
            { p: '.wormgpt',  d: 'AI Chat Bot 🤖' }
        ]
    },
    sticker: {
        icon: '🎭', label: 'Sticker & Media',
        color: '#ec4899', dark: '#831843', light: '#f9a8d4',
        commands: [
            { p: '.aya',     d: 'Animated sticker maker' },
            { p: '.convert', d: 'Sticker to image' },
            { p: '.sticker', d: 'Create sticker' },
            { p: '.take',    d: 'Custom pack name' }
        ]
    },
    tools: {
        icon: '🛠️', label: 'Tools & Utility',
        color: '#06b6d4', dark: '#155e75', light: '#67e8f9',
        commands: [
            { p: '.batchupload', d: 'Multi-file upload' },
            { p: '.fetch',       d: 'Fetch URL/API' },
            { p: '.fileinfo',    d: 'File info' },
            { p: '.imgbb',       d: 'ImgBB upload' },
            { p: '.lyrics',      d: 'Song lyrics' },
            { p: '.npm',         d: 'npm search' },
            { p: '.qr',          d: 'QR generator' },
            { p: '.qrscan',      d: 'QR scanner' },
            { p: '.sinhala',     d: 'Sinhala TTS' },
            { p: '.tomp3',       d: 'Convert to audio' },
            { p: '.toptt',       d: 'Convert to voice' },
            { p: '.ts2',         d: 'TikTok search' },
            { p: '.tts',         d: 'Text to Speech' },
            { p: '.tts2',        d: 'English TTS' },
            { p: '.vv',          d: 'View-once open' },
            { p: '.vv2',         d: 'View-once retrieve' },
            { p: '.xxx',         d: 'Adult downloader' }
        ]
    },
    news: {
        icon: '📰', label: 'News',
        color: '#f59e0b', dark: '#92400e', light: '#fcd34d',
        commands: [
            { p: '.bbc',   d: 'BBC Sinhala News' },
            { p: '.news3', d: 'Sirasa News' }
        ]
    },
    group: {
        icon: '👥', label: 'Group Management',
        color: '#10b981', dark: '#065f46', light: '#6ee7b7',
        commands: [
            { p: '.add',        d: 'Add member' },
            { p: '.antilink',   d: 'Anti-link toggle' },
            { p: '.anticall',   d: 'Block calls' },
            { p: '.cancelkick', d: 'Stop kickall' },
            { p: '.demote',     d: 'Demote admin' },
            { p: '.gid',        d: 'Group info' },
            { p: '.gst',        d: 'Group status' },
            { p: '.hidetag',    d: 'Silent tag all' },
            { p: '.kick',       d: 'Remove member' },
            { p: '.kickall',    d: 'Remove all members' },
            { p: '.kickstatus', d: 'Kick progress' },
            { p: '.mention',    d: 'Mention all' },
            { p: '.msg',        d: 'Send multi messages' },
            { p: '.mute',       d: 'Lock group' },
            { p: '.promote',    d: 'Promote to admin' },
            { p: '.unmute',     d: 'Unlock group' }
        ]
    },
    owner: {
        icon: '⚙️', label: 'Owner & Settings',
        color: '#64748b', dark: '#334155', light: '#cbd5e1',
        commands: [
            { p: '.addpremium',    d: 'Add premium user' },
            { p: '.alwaysoffline', d: 'Offline mode' },
            { p: '.antidelete',    d: 'Anti-delete toggle' },
            { p: '.autolike',      d: 'Auto react' },
            { p: '.autostatus',    d: 'Auto status view' },
            { p: '.autovoice',     d: 'Auto voice+sticker' },
            { p: '.autovv',        d: 'Auto view-once' },
            { p: '.ban',           d: 'Ban user' },
            { p: '.block',         d: 'Block user' },
            { p: '.botinfo',       d: 'Bot configuration' },
            { p: '.button',        d: 'Button mode' },
            { p: '.creact',        d: 'Mass reaction' },
            { p: '.delsudo',       d: 'Remove sudo' },
            { p: '.forward',       d: 'Forward message' },
            { p: '.forwardoff',    d: 'Disable forward' },
            { p: '.forwardon',     d: 'Enable forward' },
            { p: '.fulldp',        d: 'Full profile pic' },
            { p: '.fwd2',          d: 'Forward to 20 JIDs' },
            { p: '.fwdstatus',     d: 'Forward config' },
            { p: '.getpp',         d: 'Get profile pic' },
            { p: '.listpremium',   d: 'List premium' },
            { p: '.listsudo',      d: 'List sudo' },
            { p: '.ownermenu',     d: 'Owner panel' },
            { p: '.pair',          d: 'Pairing code' },
            { p: '.plugin',        d: 'Toggle plugin' },
            { p: '.plugins',       d: 'Show plugins' },
            { p: '.removepremium', d: 'Remove premium' },
            { p: '.resetbot',      d: 'Reset settings' },
            { p: '.restart',       d: 'Restart bot' },
            { p: '.set',           d: 'Quick set' },
            { p: '.setfname',      d: 'Set file prefix' },
            { p: '.setfooter',     d: 'Set footer name' },
            { p: '.setforward',    d: 'Set forward dest' },
            { p: '.setmode',       d: 'Set access mode' },
            { p: '.setprefix',     d: 'Set caption prefix' },
            { p: '.setsudo',       d: 'Add sudo' },
            { p: '.setthumb',      d: 'Set thumbnail' },
            { p: '.settings',      d: 'Settings menu' },
            { p: '.toggle',        d: 'Toggle feature' },
            { p: '.unban',         d: 'Unban user' },
            { p: '.unblock',       d: 'Unblock user' },
            { p: '.update',        d: 'Redeploy' }
        ]
    },
    system: {
        icon: '⚡', label: 'System & Main',
        color: '#6366f1', dark: '#312e81', light: '#a5b4fc',
        commands: [
            { p: '.alive',  d: 'Bot status' },
            { p: '.menu',   d: 'WhiteShadow menu' },
            { p: '.menu2',  d: 'This HTML menu' },
            { p: '.owner',  d: 'Owner contact' },
            { p: '.system', d: 'System stats' }
        ]
    },
    games: {
        icon: '🎮', label: 'Games',
        color: '#84cc16', dark: '#3f6212', light: '#d9f99d',
        commands: [
            { p: '.chess',  d: '♟️ Chess Game' },
            { p: '.car',    d: '🏎️ Highway Rush' },
            { p: '.dino',   d: '🦖 Chrome Dino' },
            { p: '.flappy', d: '🐦 Flappy Bird' },
            { p: '.galaxy', d: '👾 Galaxy Attack' }
        ]
    }
};

const TOTAL = Object.values(CATEGORIES).reduce((a, c) => a + c.commands.length, 0);

// ══════════════════════════════════════════════════════════════
//  PRE-RENDER category cards HTML (server-side)
// ══════════════════════════════════════════════════════════════
function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

let catGridHtml = '';
for (const key of Object.keys(CATEGORIES)) {
    const c = CATEGORIES[key];
    catGridHtml +=
        '<div class="cat-card" data-key="' + key + '" ' +
        'style="border-color:' + c.color + ';' +
        'box-shadow:0 4px 20px ' + c.dark + '88,inset 0 0 30px ' + c.dark + '44">' +
            '<span class="icon">' + c.icon + '</span>' +
            '<div class="label" style="color:' + c.light + '">' + esc(c.label) + '</div>' +
            '<div class="count" style="background:' + c.dark + ';color:' + c.light + '">' + c.commands.length + ' cmds</div>' +
        '</div>';
}

// Prepare commands JSON for JS (used in sub-view)
const commandsJson = JSON.stringify(CATEGORIES);

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

        const gameHtml = `<style>
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; margin: 0; padding: 0; }
html, body { margin: 0; padding: 0; }
body {
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Sans Symbols", "Segoe UI Symbol", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  color: #fff;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
.wrapper { width: 100%; max-width: 480px; margin: auto; padding: 12px; }
.header {
  text-align: center; margin-bottom: 12px; padding: 12px;
  background: linear-gradient(180deg, rgba(15,18,26,0.97), rgba(10,12,18,0.97));
  border: 2px solid #1e293b; border-radius: 14px;
}
.header .dot {
  display:inline-block; width:7px; height:7px; border-radius:50%;
  background:#10b981; box-shadow:0 0 8px #10b981;
  animation: pulse 1.4s ease-in-out infinite;
  margin-right: 6px; vertical-align: middle;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
.header h1 { font-size: 17px; font-weight: 900; color: #fff; letter-spacing: 2px; text-transform: uppercase; }
.header h1 span { color: #3b82f6; text-shadow: 0 0 12px rgba(59,130,246,0.6); }
.header .sub { font-size: 10px; color: #94a3b8; margin-top: 4px; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; }
.header .info-row { display:flex; justify-content: space-around; margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); }
.header .info-item .lbl { font-size:8px; color:#64748b; letter-spacing:1px; font-weight:700; text-transform:uppercase; }
.header .info-item .val { font-size:11px; color:#fff; font-weight:800; margin-top: 2px; }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cat-card {
  position: relative; padding: 14px 10px; border-radius: 14px;
  text-align: center; cursor: pointer; border: 2px solid;
  background: rgba(15,18,26,0.95);
  overflow: hidden;
  transition: transform 0.12s ease;
}
.cat-card:active { transform: scale(0.94); }
.cat-card .icon { font-size: 26px; margin-bottom: 6px; display: block; }
.cat-card .label { font-size: 11px; font-weight: 900; letter-spacing: 0.5px; color: #fff; text-transform: uppercase; }
.cat-card .count { font-size: 9px; margin-top: 5px; font-weight: 800; letter-spacing: 1px; padding: 2px 6px; border-radius: 6px; display: inline-block; }
.cat-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.4)); pointer-events: none; }

.sub-view { display: none; }
.sub-view.active { display: block; animation: fadeIn 0.25s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.back-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 14px; border-radius: 12px; margin-bottom: 10px;
  font-weight: 800; font-size: 13px; cursor: pointer;
  border: 2px solid #3b82f6; color: #93c5fd;
  background: rgba(15,18,26,0.95);
  transition: transform 0.12s ease;
}
.back-btn:active { transform: scale(0.95); }

.sub-title {
  text-align: center; padding: 12px; border-radius: 14px; margin-bottom: 10px;
  border: 2px solid; background: rgba(15,18,26,0.97);
}
.sub-title .icon { font-size: 30px; margin-bottom: 4px; }
.sub-title .label { font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
.sub-title .cnt { font-size: 10px; color: #94a3b8; margin-top: 4px; font-weight: 700; letter-spacing: 1px; }

.cmd-list { display: flex; flex-direction: column; gap: 8px; }
.cmd-item {
  padding: 10px 12px; border-radius: 12px; border: 2px solid;
  background: rgba(15,18,26,0.95);
  cursor: pointer; position: relative; overflow: hidden;
  transition: transform 0.12s ease, background 0.2s;
  min-height: 44px;
}
.cmd-item:active { transform: scale(0.97); }
.cmd-item .p-name { font-size: 13px; font-weight: 900; color: #fff; letter-spacing: 0.5px; margin-bottom: 3px; }
.cmd-item .p-desc { font-size: 10px; color: #94a3b8; font-weight: 600; line-height: 1.4; padding-right: 68px; }
.cmd-item .p-copy {
  position: absolute; top: 8px; right: 10px;
  font-size: 8px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 1px; opacity: 0.6;
  transition: opacity 0.2s, color 0.2s;
}

@keyframes copyPulse {
  0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
  70%  { box-shadow: 0 0 0 14px rgba(16,185,129,0); }
  100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
}
@keyframes checkPop {
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.cmd-item.copied {
  background: rgba(16,185,129,0.14) !important;
  border-color: #10b981 !important;
  animation: copyPulse 0.6s ease-out;
}
.cmd-item.copied .p-copy {
  color: #10b981 !important;
  opacity: 1 !important;
  animation: checkPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
}

.credit-bar {
  margin-top: 14px; text-align: center;
  font-size: 9px; font-weight: 800; letter-spacing: 1.5px;
  color: #94a3b8; text-transform: uppercase;
  border-top: 1px dashed rgba(255,255,255,0.12);
  padding-top: 8px;
}
.credit-bar span { color: #3b82f6; text-shadow: 0 0 10px rgba(59,130,246,0.5); }
</style>
<body>
<div class="wrapper">
  <div class="header">
    <h1><span class="dot"></span><span>SHAVIYA XMD</span></h1>
    <div class="sub">Interactive Menu · Tap a category</div>
    <div class="info-row">
      <div class="info-item"><div class="lbl">User</div><div class="val">${esc(userName)}</div></div>
      <div class="info-item"><div class="lbl">Time</div><div class="val">${timeStr}</div></div>
      <div class="info-item"><div class="lbl">Total</div><div class="val">${TOTAL} cmds</div></div>
    </div>
  </div>

  <div id="mainView">
    <div class="grid" id="catGrid">${catGridHtml}</div>
  </div>

  <div id="subView" class="sub-view">
    <div class="back-btn" id="backBtn">◀ BACK TO CATEGORIES</div>
    <div class="sub-title" id="subTitle"></div>
    <div class="cmd-list" id="cmdList"></div>
  </div>

  <div class="credit-bar">Engineered by <span>SAVENDRA DAMPRiya</span> ⚡</div>
</div>

<script>
(function() {
  var CATEGORIES = ${commandsJson};
  var mainView = document.getElementById('mainView');
  var subView = document.getElementById('subView');
  var catGrid = document.getElementById('catGrid');
  var subTitle = document.getElementById('subTitle');
  var cmdList = document.getElementById('cmdList');
  var backBtn = document.getElementById('backBtn');

  if (!mainView || !catGrid) return;

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        var p = navigator.clipboard.writeText(text);
        if (p && p.then) return p;
      } catch(e) {}
    }
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { ta.setSelectionRange(0, text.length); } catch(e) {}
      var ok = false;
      try { ok = document.execCommand('copy'); } catch(e) { ok = false; }
      document.body.removeChild(ta);
      return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  function handleCopyItem(item, cmd) {
    var copyEl = item.querySelector('.p-copy');
    var orig = copyEl ? copyEl.textContent : '';
    copyText(cmd).then(function() {
      if (item.classList.contains('copied')) return;
      item.classList.add('copied');
      if (copyEl) copyEl.textContent = '✓ COPIED';
      setTimeout(function() {
        item.classList.remove('copied');
        if (copyEl) copyEl.textContent = orig;
      }, 1000);
    }).catch(function() {
      if (copyEl) {
        copyEl.textContent = '✗ FAILED';
        setTimeout(function() { copyEl.textContent = orig; }, 1000);
      }
    });
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
      (function(cmdText, el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          handleCopyItem(el, cmdText);
        });
      })(cmd.p, item);
      cmdList.appendChild(item);
    }

    mainView.style.display = 'none';
    subView.classList.add('active');
  }

  // Attach click listeners to pre-rendered cards
  var cards = catGrid.querySelectorAll('.cat-card');
  for (var i = 0; i < cards.length; i++) {
    (function(card) {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        var key = card.getAttribute('data-key');
        if (key) openCat(key);
      });
    })(cards[i]);
  }

  backBtn.addEventListener('click', function(e) {
    e.preventDefault();
    subView.classList.remove('active');
    mainView.style.display = 'block';
  });
})();
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
