const { cmd } = require('../command');
const crypto = require('crypto');

// ══════════════════════════════════════════════════════════════
//  menu2.js — SHAVIYA-XMD Premium Themed Menu
//  Effects: Ripple · Confetti · Glass · Pulse · Bounce
//  Smooth Transition · Color Shift · Particle Burst
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

// Baileys fallback loader
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
        name: 'Downloads',
        pC: '#00f2fe', sC: 'rgba(0,242,254,0.3)', pS: '🌸',
        commands: [
            { cmd: 'apk', desc: 'Search and download APK' },
            { cmd: 'fb', desc: 'FB Video Downloader' },
            { cmd: 'gdrive', desc: 'Google Drive downloader' },
            { cmd: 'mediafire', desc: 'MediaFire files' },
            { cmd: 'mega', desc: 'MEGA download' },
            { cmd: 'megaget', desc: 'MEGA specific file' },
            { cmd: 'megalist', desc: 'List MEGA folder' },
            { cmd: 'novel', desc: '📚 Sinhala Novel Downloader' },
            { cmd: 'nquick', desc: '⚡ Novel quick download' },
            { cmd: 'song', desc: 'YouTube Song' },
            { cmd: 'song2', desc: 'YouTube Song V2' },
            { cmd: 'tiktok', desc: 'TikTok Downloader' },
            { cmd: 'twitter', desc: 'Twitter videos' },
            { cmd: 'yt', desc: 'YouTube downloader' },
            { cmd: 'yt2', desc: 'YouTube multiple quality' }
        ]
    },
    movie: {
        name: 'Movie & Anime',
        pC: '#f6d365', sC: 'rgba(246,211,101,0.3)', pS: '🍿',
        commands: [
            { cmd: 'anime', desc: 'SL Anime Club' },
            { cmd: 'cartoonlatest', desc: 'SinhalaCartoons latest' },
            { cmd: 'cmovie', desc: 'CineSubz movies' },
            { cmd: 'cz', desc: 'CineSubz downloader' },
            { cmd: 'dinka', desc: 'Drive hybrid' },
            { cmd: 'movie', desc: 'Multi-reply movie engine' },
            { cmd: 'sinhalacartoon', desc: 'SinhalaCartoons search' },
            { cmd: 'sinhalasubw', desc: 'SinhalaSub.lk' },
            { cmd: 'slcartoon', desc: 'Sinhala Cartoon' },
            { cmd: 'hanime', desc: '🎬 Hanime search' },
            { cmd: 'hdown', desc: '📥 Hanime download' }
        ]
    },
    ai: {
        name: 'AI & Fun',
        pC: '#ff0844', sC: 'rgba(255,8,68,0.3)', pS: '💮',
        commands: [
            { cmd: 'deepseek', desc: 'DeepSeek AI' },
            { cmd: 'pupilmv', desc: 'Pupil movie search' },
            { cmd: 'alya', desc: 'AI Girlfriend Alya' },
            { cmd: 'text2img', desc: 'AI image generator' },
            { cmd: 'vchange', desc: 'Voice changer' },
            { cmd: 'wormgpt', desc: 'AI Chat Bot' }
        ]
    },
    sticker: {
        name: 'Sticker & Media',
        pC: '#b185fa', sC: 'rgba(177,133,250,0.3)', pS: '🍃',
        commands: [
            { cmd: 'aya', desc: 'Animated sticker maker' },
            { cmd: 'convert', desc: 'Sticker to image' },
            { cmd: 'sticker', desc: 'Create sticker' },
            { cmd: 'take', desc: 'Custom pack name' }
        ]
    },
    tools: {
        name: 'Tools & Utility',
        pC: '#00d9a0', sC: 'rgba(0,217,160,0.3)', pS: '🔧',
        commands: [
            { cmd: 'batchupload', desc: 'Multi-file upload' },
            { cmd: 'fetch', desc: 'Fetch URL/API' },
            { cmd: 'fileinfo', desc: 'File info' },
            { cmd: 'getpp', desc: 'Get profile picture' },
            { cmd: 'getpp2', desc: '🖼️ PP fetcher (WebUI)' },
            { cmd: 'imgbb', desc: 'ImgBB upload' },
            { cmd: 'lyrics', desc: 'Song lyrics' },
            { cmd: 'npm', desc: 'npm search' },
            { cmd: 'qr', desc: '📷 QR Code Generator' },
            { cmd: 'qrscan', desc: 'QR scanner' },
            { cmd: 'sinhala', desc: 'Sinhala TTS' },
            { cmd: 'tomp3', desc: 'Convert to audio' },
            { cmd: 'toptt', desc: 'Convert to voice' },
            { cmd: 'ts2', desc: 'TikTok search' },
            { cmd: 'tts', desc: 'Text to Speech' },
            { cmd: 'tts2', desc: 'English TTS' },
            { cmd: 'vv', desc: 'View-once open' },
            { cmd: 'vv2', desc: 'View-once retrieve' }
        ]
    },
    news: {
        name: 'News',
        pC: '#ffeb3b', sC: 'rgba(255,235,59,0.3)', pS: '📰',
        commands: [
            { cmd: 'bbc', desc: 'BBC Sinhala News' },
            { cmd: 'news3', desc: 'Sirasa News' }
        ]
    },
    group: {
        name: 'Group Management',
        pC: '#0ba360', sC: 'rgba(11,163,96,0.3)', pS: '🛡',
        commands: [
            { cmd: 'add', desc: 'Add member' },
            { cmd: 'antilink', desc: 'Anti-link toggle' },
            { cmd: 'anticall', desc: 'Block calls' },
            { cmd: 'cancelkick', desc: 'Stop kickall' },
            { cmd: 'demote', desc: 'Demote admin' },
            { cmd: 'gid', desc: 'Group info' },
            { cmd: 'gst', desc: 'Group status' },
            { cmd: 'hidetag', desc: 'Silent tag all' },
            { cmd: 'kick', desc: 'Remove member' },
            { cmd: 'kickall', desc: 'Remove all members' },
            { cmd: 'kickstatus', desc: 'Kick progress' },
            { cmd: 'mention', desc: 'Mention all' },
            { cmd: 'msg', desc: 'Send multi messages' },
            { cmd: 'mute', desc: 'Lock group' },
            { cmd: 'promote', desc: 'Promote to admin' },
            { cmd: 'unmute', desc: 'Unlock group' }
        ]
    },
    owner: {
        name: 'Owner & Settings',
        pC: '#2962ff', sC: 'rgba(41,98,255,0.3)', pS: '👑',
        commands: [
            { cmd: 'addpremium', desc: 'Add premium user' },
            { cmd: 'alwaysoffline', desc: 'Offline mode' },
            { cmd: 'antidelete', desc: 'Anti-delete toggle' },
            { cmd: 'autolike', desc: 'Auto react' },
            { cmd: 'autostatus', desc: 'Auto status view' },
            { cmd: 'autovoice', desc: 'Auto voice+sticker' },
            { cmd: 'autovv', desc: 'Auto view-once' },
            { cmd: 'ban', desc: 'Ban user' },
            { cmd: 'block', desc: 'Block user' },
            { cmd: 'botinfo', desc: 'Bot configuration' },
            { cmd: 'button', desc: 'Button mode' },
            { cmd: 'creact', desc: 'Mass reaction' },
            { cmd: 'delsudo', desc: 'Remove sudo' },
            { cmd: 'forward', desc: 'Forward message' },
            { cmd: 'forwardoff', desc: 'Disable forward' },
            { cmd: 'forwardon', desc: 'Enable forward' },
            { cmd: 'fulldp', desc: 'Full profile pic' },
            { cmd: 'fwd2', desc: 'Forward to 20 JIDs' },
            { cmd: 'getpp', desc: 'Get profile pic' },
            { cmd: 'listpremium', desc: 'List premium' },
            { cmd: 'listsudo', desc: 'List sudo' },
            { cmd: 'ownermenu', desc: 'Owner panel' },
            { cmd: 'pair', desc: 'Pairing code' },
            { cmd: 'plugin', desc: 'Toggle plugin' },
            { cmd: 'plugins', desc: 'Show plugins' },
            { cmd: 'removepremium', desc: 'Remove premium' },
            { cmd: 'resetbot', desc: 'Reset settings' },
            { cmd: 'restart', desc: 'Restart bot' },
            { cmd: 'set', desc: 'Quick set' },
            { cmd: 'setfname', desc: 'Set file prefix' },
            { cmd: 'setfooter', desc: 'Set footer name' },
            { cmd: 'setforward', desc: 'Set forward dest' },
            { cmd: 'setmode', desc: 'Set access mode' },
            { cmd: 'setprefix', desc: 'Set caption prefix' },
            { cmd: 'setsudo', desc: 'Add sudo' },
            { cmd: 'setthumb', desc: 'Set thumbnail' },
            { cmd: 'settings', desc: 'Settings menu' },
            { cmd: 'toggle', desc: 'Toggle feature' },
            { cmd: 'unban', desc: 'Unban user' },
            { cmd: 'unblock', desc: 'Unblock user' },
            { cmd: 'update', desc: 'Redeploy' }
        ]
    },
    system: {
        name: 'System & Main',
        pC: '#9c27b0', sC: 'rgba(156,39,176,0.3)', pS: '⚡',
        commands: [
            { cmd: 'alive', desc: 'Bot status' },
            { cmd: 'menu', desc: 'WhiteShadow menu' },
            { cmd: 'menu2', desc: 'This HTML menu' },
            { cmd: 'owner', desc: 'Owner contact' },
            { cmd: 'system', desc: 'System stats' }
        ]
    },
    games: {
        name: 'Games',
        pC: '#ff6b9d', sC: 'rgba(255,107,157,0.3)', pS: '🎮',
        commands: [
            { cmd: 'chess', desc: 'Chess Game' },
            { cmd: 'car', desc: 'Highway Rush' },
            { cmd: 'dino', desc: 'Chrome Dino' },
            { cmd: 'flappy', desc: 'Flappy Bird' },
            { cmd: 'galaxy', desc: 'Galaxy Attack' }
        ]
    },
    nsfw: {
        name: '18+ Adult',
        pC: '#dc2626', sC: 'rgba(220,38,38,0.35)', pS: '🔞',
        commands: [
            { cmd: 'hentai', desc: '🔞 Hentai search & download' },
            { cmd: 'xxx', desc: '🔞 Adult content downloader' },
            { cmd: 'sumi', desc: '💋 AI Girlfriend Sumi (18+)' }
        ]
    }
};

const PREFIX = '.';
const TOTAL = Object.values(CATEGORIES).reduce((a, c) => a + c.commands.length, 0);

// ══════════════════════════════════════════════════════════════
//  .menu2 command
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'menu2',
    alias: ['hmen', 'htmlmenu', 'uimenu', 'newmenu'],
    desc: 'Premium themed HTML menu with effects',
    category: 'main',
    react: '🎨',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🎨', key: mek.key } });

        const randomResId = crypto.randomUUID();
        const randomBotResId = crypto.randomUUID();

        const userName = m.pushName || 'User';
        const now = new Date();
        const timeStr = now.toLocaleString('en-US', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        let mainCards = '';
        const catKeys = Object.keys(CATEGORIES);
        for (const key of catKeys) {
            const c = CATEGORIES[key];
            const count = c.commands.length;
            mainCards += `<div class="mc" data-cat="${key}" data-color="${c.pC}" style="border-color:${c.pC};box-shadow:0 4px 20px ${c.sC},inset 0 0 30px ${c.sC}">
                <div class="mc-icon">${c.pS}</div>
                <div class="mc-label" style="color:${c.pC}">${c.name}</div>
                <div class="mc-count" style="background:${c.sC};color:${c.pC}">${count} cmds</div>
            </div>`;
        }

        const mainHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"><style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans','Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{background:#0d001a;color:#fff;overflow-x:hidden;min-height:100vh}
.bg{position:fixed;inset:0;z-index:-1;background:radial-gradient(circle at 20% 30%,rgba(41,98,255,0.3) 0,transparent 50%),radial-gradient(circle at 80% 70%,rgba(156,39,176,0.3) 0,transparent 50%)}
.psvg{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999;opacity:0.6}
.c{padding:12px;z-index:1;max-width:480px;margin:auto}
.h{text-align:center;margin-bottom:14px;padding:14px;background:linear-gradient(180deg,rgba(15,18,26,0.97),rgba(10,12,18,0.97));border:2px solid #1e293b;border-radius:14px;position:relative;overflow:hidden}
.h::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(59,130,246,0.15),transparent 50%,rgba(156,39,176,0.15));pointer-events:none}
.hi{display:flex;justify-content:center;margin-bottom:6px;position:relative;z-index:1}
.hi svg{animation:d 2s ease-in-out infinite alternate}
@keyframes d{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-8px) scale(1.05)}}
h1{font-size:20px;color:#3b82f6;text-shadow:0 0 12px rgba(59,130,246,0.6);letter-spacing:2px;text-transform:uppercase;position:relative;z-index:1}
p{color:#8c9eff;font-size:11px;margin-top:4px;letter-spacing:1px;position:relative;z-index:1}
.info{display:flex;justify-content:space-around;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(255,255,255,0.1);position:relative;z-index:1}
.info>div{text-align:center}
.info .lbl{font-size:8px;color:#64748b;letter-spacing:1px;font-weight:700;text-transform:uppercase}
.info .val{font-size:11px;color:#fff;font-weight:800;margin-top:2px}
.cl{display:grid;grid-template-columns:1fr 1fr;gap:10px}

/* 🌟 Glass Effect */
.mc{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:rgba(15,18,26,0.75);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:2px solid;padding:14px 8px;border-radius:14px;cursor:pointer;transition:transform 0.12s ease,background 0.2s,box-shadow 0.3s;position:relative;overflow:hidden}
.mc:active{transform:scale(0.94);background:rgba(59,130,246,0.15)}

/* ✨ Hover Glow (for desktop browsers) */
.mc:hover{box-shadow:0 8px 40px currentColor !important;background:rgba(30,41,59,0.85)}

/* 🌟 Pulse Ring */
@keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(59,130,246,0.5),0 4px 20px rgba(59,130,246,0.3)}100%{box-shadow:0 0 0 20px rgba(59,130,246,0),0 4px 20px rgba(59,130,246,0.3)}}
.mc.pulse{animation:pulseRing 1.5s ease-out infinite}

/* 🌊 Ripple Effect */
.ripple{position:absolute;border-radius:50%;background:rgba(255,255,255,0.5);transform:scale(0);animation:rippleAnim 0.6s ease-out;pointer-events:none;z-index:10}
@keyframes rippleAnim{to{transform:scale(4);opacity:0}}

/* 💥 Confetti */
.confetti{position:fixed;width:8px;height:8px;border-radius:50%;pointer-events:none;z-index:9999;animation:confettiFall 0.8s cubic-bezier(0.4,0,0.6,1) forwards}
@keyframes confettiFall{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(0.2);opacity:0}}

/* 🎨 Color Shift on tap */
@keyframes colorShift{0%{filter:brightness(1)}50%{filter:brightness(1.4) saturate(1.5)}100%{filter:brightness(1)}}
.mc.shifting{animation:colorShift 0.4s ease-out}

/* 🚀 Bounce */
@keyframes bounce{0%,100%{transform:scale(1)}50%{transform:scale(0.92)}}
.mc.bouncing{animation:bounce 0.25s ease-out}

.mc-icon{font-size:26px;margin-bottom:6px;position:relative;z-index:1}
.mc-label{font-size:11px;font-weight:900;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;position:relative;z-index:1}
.mc-count{font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:6px;position:relative;z-index:1}

/* 📊 Loading Spinner */
.spinner-wrap{display:flex;justify-content:center;align-items:center;padding:40px 20px;flex-direction:column;gap:12px}
.spinner{width:38px;height:38px;border:3px solid rgba(59,130,246,0.2);border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner-text{color:#8c9eff;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700}

.f{text-align:center;color:#555;font-size:10px;padding:14px 0;letter-spacing:1.5px;text-transform:uppercase}
.f span{color:#3b82f6;font-weight:900;text-shadow:0 0 10px rgba(59,130,246,0.5)}

/* 🎭 Smooth Transition */
.fs{animation:fade 0.4s cubic-bezier(0.4,0,0.2,1)}
@keyframes fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

/* 💚 Popup */
.pop{position:fixed;background:#10b981;color:#fff;padding:6px 12px;border-radius:10px;font-size:11px;font-weight:800;pointer-events:none;transition:0.4s;z-index:9999;box-shadow:0 4px 20px rgba(16,185,129,0.5)}
.pa{opacity:0;transform:translateY(-30px)}

/* 🌈 Category header glow */
.cat-h{position:relative;overflow:hidden}
.cat-h::after{content:'';position:absolute;inset:-2px;background:radial-gradient(circle at 50% 50%,currentColor 0,transparent 70%);opacity:0.15;pointer-events:none}
</style></head><body>
<div class="bg"></div>
<svg class="psvg" id="psvg"></svg>
<div class="c" id="mainWrap">
  <div class="h">
    <div class="hi"><svg width="60" height="60" viewBox="0 0 100 100"><polygon points="50,15 61,38 85,38 65,53 73,76 50,61 27,76 35,53 15,38 39,38" fill="none" stroke="#3b82f6" stroke-width="2"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite"/></polygon></svg></div>
    <h1>SHAVIYA XMD</h1>
    <p>Interactive Menu · Tap a category</p>
    <div class="info">
      <div><div class="lbl">User</div><div class="val">${userName.replace(/</g, '&lt;')}</div></div>
      <div><div class="lbl">Time</div><div class="val">${timeStr}</div></div>
      <div><div class="lbl">Total</div><div class="val">${TOTAL} cmds</div></div>
    </div>
  </div>
  <div class="cl" id="cl">${mainCards}</div>
  <div class="f">Engineered by <span>SAVENDRA DAMPRiya</span> ⚡</div>
</div>
<script>
(function(){
  var catThemes = ${JSON.stringify(Object.keys(CATEGORIES).reduce((o, k) => {
      o[k] = { pS: CATEGORIES[k].pS, pC: CATEGORIES[k].pC };
      return o;
  }, {}))};
  var allData = ${JSON.stringify(Object.keys(CATEGORIES).reduce((o, k) => {
      o[k] = { name: CATEGORIES[k].name, cmds: CATEGORIES[k].commands };
      return o;
  }, {}))};
  var prefix = '${PREFIX}';

  var psvg = document.getElementById('psvg');
  for (var i = 0; i < 10; i++) {
    var x = Math.random() * 90 + 5;
    var delay = Math.random() * 10;
    var dur = Math.random() * 10 + 12;
    var sway = Math.random() * 8 + 4;
    var emojis = ['✨','💫','⭐','🌟','💎','🔮'];
    var e = emojis[i % emojis.length];
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x + '%');
    t.setAttribute('y', '-10%');
    t.setAttribute('font-size', '22');
    t.setAttribute('text-anchor', 'middle');
    t.innerHTML = e +
      '<animate attributeName="y" values="-10%;110%" dur="' + dur + 's" begin="' + delay + 's" repeatCount="indefinite"/>' +
      '<animate attributeName="x" values="' + x + '%;' + (x + sway) + '%;' + (x - sway) + '%;' + x + '%" dur="' + (dur / 3) + 's" begin="' + delay + 's" repeatCount="indefinite"/>';
    psvg.appendChild(t);
  }

  // 💚 Popup
  function popup(x, y, msg) {
    var p = document.createElement('div');
    p.innerText = msg || 'Copied!';
    p.className = 'pop';
    p.style.left = (x - 20) + 'px';
    p.style.top = (y - 20) + 'px';
    document.body.appendChild(p);
    setTimeout(function(){ p.classList.add('pa'); }, 10);
    setTimeout(function(){ p.remove(); }, 600);
  }

  // 🌊 Ripple Effect
  function ripple(el, ev) {
    try {
      var rect = el.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var cx = (ev.clientX || rect.left + rect.width / 2) - rect.left;
      var cy = (ev.clientY || rect.top + rect.height / 2) - rect.top;
      var r = document.createElement('span');
      r.className = 'ripple';
      r.style.width = size + 'px';
      r.style.height = size + 'px';
      r.style.left = (cx - size / 2) + 'px';
      r.style.top = (cy - size / 2) + 'px';
      el.appendChild(r);
      setTimeout(function() { if (r.parentNode) r.parentNode.removeChild(r); }, 650);
    } catch(e){}
  }

  // 💥 Confetti Burst
  function confetti(x, y, color) {
    var colors = [color || '#10b981', '#fbbf24', '#3b82f6', '#ec4899', '#fff'];
    for (var i = 0; i < 14; i++) {
      var el = document.createElement('div');
      el.className = 'confetti';
      var angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
      var dist = 50 + Math.random() * 60;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.background = colors[i % colors.length];
      el.style.setProperty('--tx', (Math.cos(angle) * dist) + 'px');
      el.style.setProperty('--ty', (Math.sin(angle) * dist - 20) + 'px');
      document.body.appendChild(el);
      (function(node) {
        setTimeout(function() { if (node.parentNode) node.parentNode.removeChild(node); }, 850);
      })(el);
    }
  }

  // 📋 Copy function
  function copy(text, x, y) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { navigator.clipboard.writeText(text); } catch(e) {}
    }
    ta.remove();
    popup(x, y, 'Copied!');
  }

  // Save main view
  var wrap = document.getElementById('mainWrap');
  var mainViewHTML = wrap.innerHTML;

  // Main menu click
  function handleMainClick(e) {
    var card = e.target.closest('.mc');
    if (!card) return;

    // 🌊 Ripple + 🎨 Color Shift + 🚀 Bounce
    ripple(card, e);
    card.classList.add('shifting', 'bouncing');
    setTimeout(function(){ card.classList.remove('shifting', 'bouncing'); }, 420);

    var key = card.getAttribute('data-cat');
    var data = allData[key];
    if (!data) return;
    var theme = catThemes[key];

    // 📊 Show spinner
    showSpinner(theme.pC, function() {
      renderCategory(data, theme, key);
    });
  }

  // 📊 Loading Spinner
  function showSpinner(color, cb) {
    wrap.innerHTML = '<div class="spinner-wrap">' +
      '<div class="spinner" style="border-top-color:' + color + '"></div>' +
      '<div class="spinner-text" style="color:' + color + '">Loading...</div>' +
      '</div>';
    setTimeout(cb, 320);
  }

  function renderCategory(data, theme, key) {
    var html = '<div class="h cat-h" style="border-color:' + theme.pC + ';color:' + theme.pC + '">' +
      '<div class="hi"><span style="font-size:40px">' + theme.pS + '</span></div>' +
      '<h1 style="color:' + theme.pC + ';text-shadow:0 0 12px ' + theme.pC + '">' + data.name.toUpperCase() + '</h1>' +
      '<p>' + data.cmds.length + ' commands available</p>' +
      '</div>' +
      '<div style="display:flex;justify-content:center;margin-bottom:10px">' +
      '<button id="backBtn" style="padding:10px 20px;border-radius:10px;border:2px solid ' + theme.pC + ';background:rgba(15,18,26,0.95);color:' + theme.pC + ';font-weight:900;font-size:12px;letter-spacing:1px;cursor:pointer;backdrop-filter:blur(10px)">◀ BACK</button>' +
      '</div>' +
      '<div class="cl" id="cmdList">';

    for (var i = 0; i < data.cmds.length; i++) {
      var cmd = data.cmds[i];
      var desc = cmd.desc.length > 25 ? cmd.desc.substring(0, 22) + '..' : cmd.desc;
      var full = prefix + cmd.cmd;
      html += '<div class="mc cr" data-cmd="' + full + '" data-color="' + theme.pC + '" style="border-color:' + theme.pC + '">' +
        '<div class="mc-label" style="color:' + theme.pC + '">' + cmd.cmd.toUpperCase() + '</div>' +
        '<i style="font-size:9px;color:#aaa;font-style:normal;line-height:1.2;padding:0 4px;position:relative;z-index:1">' + desc + '</i>' +
        '<span style="background:#0009;padding:3px 8px;border-radius:4px;font-family:monospace;font-size:10px;color:' + theme.pC + ';border:1px solid #fff2;margin-top:4px;position:relative;z-index:1">' + full + '</span>' +
        '</div>';
    }
    html += '</div><div class="f">Engineered by <span>SAVENDRA DAMPRiya</span> ⚡</div>';

    wrap.innerHTML = html;
    wrap.classList.remove('fs');
    void wrap.offsetWidth;
    wrap.classList.add('fs');

    // Command tap — Ripple + Confetti + Copy
    document.getElementById('cmdList').onclick = function(ev) {
      var item = ev.target.closest('.cr');
      if (!item) return;

      // 🌊 Ripple + 🚀 Bounce
      ripple(item, ev);
      item.classList.add('bouncing');
      setTimeout(function(){ item.classList.remove('bouncing'); }, 280);

      var txt = item.getAttribute('data-cmd');
      var color = item.getAttribute('data-color') || '#10b981';

      if (txt) {
        copy(txt, ev.clientX, ev.clientY);
        // 💥 Confetti burst
        confetti(ev.clientX, ev.clientY, color);
      }
    };

    // ✅ FIXED Back button — Smooth transition back
    document.getElementById('backBtn').onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      wrap.innerHTML = mainViewHTML;
      wrap.classList.remove('fs');
      void wrap.offsetWidth;
      wrap.classList.add('fs');
      document.getElementById('cl').onclick = handleMainClick;
    };
  }

  // Attach main handler
  document.getElementById('cl').onclick = handleMainClick;
})();
</script></body></html>`;

        const unifiedDataJson = JSON.stringify({
            "response_id": randomResId,
            "sections": [{
                "view_model": {
                    "primitive": {
                        "__typename": "GenAIaeacdsnwHtmlPrimitive",
                        "payload": mainHtml,
                        "trusted_sources": ["wa.me", "whatsapp.com"]
                    },
                    "__typename": "GenAISingleLayoutViewModel"
                }
            }]
        });

        const unifiedData = Buffer.from(unifiedDataJson).toString('base64');

        let buttonMessage = generateWAMessageFromContent(from, {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [{ messageType: 2, messageText: `🎨 *SHAVIYA-XMD MENU*` }],
                        unifiedResponse: { data: unifiedData },
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
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
                botResponseId: randomBotResId,
                verificationMetadata: {
                    proofs: [{
                        version: 1,
                        useCase: 1,
                        signature: "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LVZlcmlmaWNhdGlvblNpZ25hdHVyZS5NZXRhZGF0YeN55YRyad2+ZA==",
                        certificateChain: [
                            "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGEOvtJr968bbpKdZreOTwkk9aPN++XPE60RfuzNLkXXc7LE8BOkJOWRpo2oNXaRJ3uCNJ43HY3A+oetnvHSfcxWqmvvTSrBOI5V1NOD6RMsZ/st1XVPUx83AGps1l5jYBOYzqMNy6un2tToJ2Bt9bXRo29tWLZTu8m7TNY/hISwVpVc5tjSet5U7btPN+dMIx2UvykB1jcbWGsdklheeuz8RXSStNXzeaGvsf1lpZ/ugLE4b2BdmlRNKrY6zLE4qFtRYQoS7axOyQX+4QUyN2m9bfm7urQmn+QRSXJwMO7X5kAJJLbkVGJFt9Pm9VXPwQVrK2aaqiXlpusj+7DfDw00OULmYMmZDTqXM0nUVLxj13z0LhMQoQhhNG8utdUn4uKOFceliTZ/xiP+A54GnX9620641bqw3ctfh9NNXPsTEK8hAUD7FDqUhVntHmoEYYEHq8X1tHHZYP49/f2iezTiE8AUaoZo42/jIWQIKohOGNUib2hEqMkW8NsR8vPihvNuqPc0zKZcl6359YFQdjiiW8kCRD/rsDOr9v1eYLFZKYloFyzFqEgj+jcG/V47elOjShJ5CCPwatXwP6HIloVwtgygFsnOFmCg6Ojoivfoz8Nw1qxFwg5OU2cq/1WbWNELKnaFg4eUWCAIJ/3ZIJsEPkgemZxGhE+hdiNn9dkQYBJs1kx2BxdIkJmQ9vJSKkrMz6lTxZM3IJ9mhmKS6zYdU1ppeAao0/ayte997DQParb/AHLN79g0iW1ad0z8ir5jAl0q3a+UZPTSa4YiSqC2PZ/gfxG5wvL2mKmeKowG0RXjmEp5iNxrni+T/HRLZOoH7y0DQ24nMCPg",
                            "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGHsL0Ccm0ELINFZ2IaBhKaeWnVuh0o6nZLCioCn9xpSADzwIS5VCWO+1eVXT2atJOyf7FYlpB0/JA3Us+aQtekuIkHu/zBXijORZ4ClF4+sF3cSTNg6gY/+6iwLK/zs3bMg+GeJrcI65vXfs95Shxlb2Rd5GRT2/2yBmR6Zkf5QwMJuptUHWtM26WY7/xlkEKGFYDZVqOSylusiOzSALa815zC6dCiHoJNLBEKMlaZZQOk57/+OYoU5zzTaEgLhyvNFHSyAlyLQ3SGFtVHAaJZHSmmSPyJowCOB+92Gkk6SWVMsk6FbU8QJWFtlhzV/W/gZ7WzUlS/AKgN0th9/cq20ToFkW7X9c+rtYavufmuieqFhXgaMD8AGsoN9QC/HzNC9D1nydPfFYEUr9BHVy2nF5gM58Y59r2rT8p5LPARIkUp8g+5DLhyW0tdZFZ1305o4AHCayZnp5rjcU2Xi/c1Qf/djBGakmijlMs4aMzKJYD0c4Q8jdI7sNyd876K2wRD+L6KeD2QB3PtCS4P7BWAl5gh5CJ6ZBrwcaKXZqcSjEwm52MqVCgYZdapAaNYUy/QndttjLOG0wxxwuX1hIhMjPnIKZR1kwnqD5EqlHpilrnojRZvjVGN4zEKmilS8rNstt4HHs/D849W+Q6LRVWiWMs0cT2IugrX+Skxd8En7Gq52UEmuVBrSTpN+UpIu20NsVb9lsvuYh3XO441606tOEY2eKcZJdTtqrOTNqbbTk0zVn1yhbOCvmfctBNDhTwaC5QMi0P9wjU5XI9SBtkdQLizc5oqpoiHeqgb8+aJHVLcbgIJ/KLZKtRWFDfzRNM02Csx4etUUapVd2NA/L0oMs/O5T9sVj9FBJ7q99GWr3PVmxJb36mHZLXC4k1gGN9swE0LtzYsUdT5tUo9ri/hS3W/SM+F1p4Kh4QIgRcG3ciIHGN44bnDh3HDCz0fDnzKYw0bclMxZPctEyJ5gEOPF6OAkjD9dEaRGq/tEPf1k9Aub+v2dEjnfrYWAm4E5Zfhs2Xh0CT0k+SzhgKd0K/46ChJ20G5+blwpIvahvTVS68+aVIX6CwXs4tcVx6FnmVsMOOkIasfaqQLZYbNBkuLoZnQAq4j8yRekrQ=="
                        ]
                    }]
                }
            }
        };

        await conn.relayMessage(from, buttonMessage.message, {
            messageId: buttonMessage.key.id
        });

    } catch (err) {
        console.error('[MENU2] Error:', err.message);
        return reply('❌ Menu2 load error: ' + err.message);
    }
});
