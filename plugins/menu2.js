const { cmd } = require('../command');
const crypto = require('crypto');

// ══════════════════════════════════════════════════════════════
//  menu2.js — SHAVIYA-XMD Premium Themed Menu
//  Themes · SVG animations · Floating particles · Tap-to-copy
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
//  Category Data (with theme info)
// ─────────────────────────────────────────────
const CATEGORIES = {
    download: {
        name: 'Downloads',
        pC: '#00f2fe', sC: 'rgba(0,242,254,0.3)', pS: '🌸',
        svg: `<svg width="60" height="60" viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" rx="15" fill="#001a1a" stroke="#00f2fe" stroke-width="2"/><path d="M50,35 L50,65 M35,50 L50,65 L65,50" stroke="#00f2fe" stroke-width="4" stroke-linecap="round"/><line x1="30" y1="75" x2="70" y2="75" stroke="#00f2fe" stroke-width="4"/></svg>`,
        commands: [
            { cmd: 'apk', desc: 'Search and download APK' },
            { cmd: 'fb', desc: 'FB Video Downloader' },
            { cmd: 'gdrive', desc: 'Google Drive downloader' },
            { cmd: 'mediafire', desc: 'MediaFire files' },
            { cmd: 'mega', desc: 'MEGA download' },
            { cmd: 'megaget', desc: 'MEGA specific file' },
            { cmd: 'megalist', desc: 'List MEGA folder' },
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
        svg: `<svg width="60" height="60" viewBox="0 0 100 100"><rect x="25" y="20" width="30" height="25" rx="5" fill="none" stroke="#f6d365" stroke-width="2"/><circle cx="33" cy="30" r="3" fill="#f6d365"/><circle cx="47" cy="30" r="3" fill="#f6d365"/><polygon points="80,52 90,48 90,67 80,63" fill="none" stroke="#f6d365" stroke-width="2"/></svg>`,
        commands: [
            { cmd: 'anime', desc: 'SL Anime Club' },
            { cmd: 'cartoonlatest', desc: 'SinhalaCartoons latest' },
            { cmd: 'cmovie', desc: 'CineSubz movies' },
            { cmd: 'cz', desc: 'CineSubz downloader' },
            { cmd: 'dinka', desc: 'Drive hybrid' },
            { cmd: 'movie', desc: 'Multi-reply movie engine' },
            { cmd: 'sinhalacartoon', desc: 'SinhalaCartoons search' },
            { cmd: 'sinhalasubw', desc: 'SinhalaSub.lk' },
            { cmd: 'slcartoon', desc: 'Sinhala Cartoon' }
        ]
    },
    ai: {
        name: 'AI & Fun',
        pC: '#ff0844', sC: 'rgba(255,8,68,0.3)', pS: '💮',
        svg: `<svg width="60" height="60" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#ff0844" stroke-width="2"/><rect x="25" y="35" width="50" height="30" rx="10" fill="#111" stroke="#ff0844" stroke-width="2"/><circle cx="35" cy="50" r="5" fill="#ff0844"/><circle cx="65" cy="50" r="5" fill="#ff0844"/></svg>`,
        commands: [
            { cmd: 'deepseek', desc: 'DeepSeek AI' },
            { cmd: 'pupilmv', desc: 'Pupil movie search' },
            { cmd: 'sumi', desc: 'AI Girlfriend Sumi' },
            { cmd: 'alya', desc: 'AI Girlfriend Alya' },
            { cmd: 'text2img', desc: 'AI image generator' },
            { cmd: 'vchange', desc: 'Voice changer' },
            { cmd: 'wormgpt', desc: 'AI Chat Bot' }
        ]
    },
    sticker: {
        name: 'Sticker & Media',
        pC: '#b185fa', sC: 'rgba(177,133,250,0.3)', pS: '🍃',
        svg: `<svg width="60" height="60" viewBox="0 0 100 100"><rect x="25" y="20" width="50" height="60" rx="8" fill="none" stroke="#b185fa" stroke-width="2"/><circle cx="40" cy="40" r="6" fill="#b185fa"/><path d="M30,70 L45,50 L60,70 Z" fill="#b185fa"/></svg>`,
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
        svg: `<svg width="60" height="60" viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="none" stroke="#00d9a0" stroke-width="4" stroke-dasharray="10 5"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="5s" repeatCount="indefinite"/></circle><circle cx="50" cy="50" r="10" fill="#00d9a0"/></svg>`,
        commands: [
            { cmd: 'batchupload', desc: 'Multi-file upload' },
            { cmd: 'fetch', desc: 'Fetch URL/API' },
            { cmd: 'fileinfo', desc: 'File info' },
            { cmd: 'imgbb', desc: 'ImgBB upload' },
            { cmd: 'lyrics', desc: 'Song lyrics' },
            { cmd: 'npm', desc: 'npm search' },
            { cmd: 'qr', desc: 'QR generator' },
            { cmd: 'qrscan', desc: 'QR scanner' },
            { cmd: 'sinhala', desc: 'Sinhala TTS' },
            { cmd: 'tomp3', desc: 'Convert to audio' },
            { cmd: 'toptt', desc: 'Convert to voice' },
            { cmd: 'ts2', desc: 'TikTok search' },
            { cmd: 'tts', desc: 'Text to Speech' },
            { cmd: 'tts2', desc: 'English TTS' },
            { cmd: 'vv', desc: 'View-once open' },
            { cmd: 'vv2', desc: 'View-once retrieve' },
            { cmd: 'xxx', desc: 'Adult downloader' }
        ]
    },
    news: {
        name: 'News',
        pC: '#ffeb3b', sC: 'rgba(255,235,59,0.3)', pS: '📰',
        svg: `<svg width="60" height="60" viewBox="0 0 100 100"><rect x="20" y="25" width="60" height="50" rx="4" fill="none" stroke="#ffeb3b" stroke-width="2"/><line x1="30" y1="40" x2="70" y2="40" stroke="#ffeb3b" stroke-width="2"/><line x1="30" y1="50" x2="70" y2="50" stroke="#ffeb3b" stroke-width="2"/><line x1="30" y1="60" x2="55" y2="60" stroke="#ffeb3b" stroke-width="2"/></svg>`,
        commands: [
            { cmd: 'bbc', desc: 'BBC Sinhala News' },
            { cmd: 'news3', desc: 'Sirasa News' }
        ]
    },
    group: {
        name: 'Group Management',
        pC: '#0ba360', sC: 'rgba(11,163,96,0.3)', pS: '🛡',
        svg: `<svg width="60" height="60" viewBox="0 0 100 100"><circle cx="50" cy="40" r="15" fill="none" stroke="#0ba360" stroke-width="2"/><path d="M25,80 Q50,50 75,80" fill="none" stroke="#0ba360" stroke-width="2"/><circle cx="25" cy="50" r="10" fill="none" stroke="#0ba360" stroke-width="2"/><circle cx="75" cy="50" r="10" fill="none" stroke="#0ba360" stroke-width="2"/></svg>`,
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
        svg: `<svg width="60" height="60" viewBox="0 0 100 100"><polygon points="50,15 61,38 85,38 65,53 73,76 50,61 27,76 35,53 15,38 39,38" fill="none" stroke="#2962ff" stroke-width="2"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite"/></polygon></svg>`,
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
        svg: `<svg width="60" height="60" viewBox="0 0 100 100"><polygon points="55,10 30,55 48,55 45,90 70,45 52,45" fill="none" stroke="#9c27b0" stroke-width="3" stroke-linejoin="round"/></svg>`,
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
        svg: `<svg width="60" height="60" viewBox="0 0 100 100"><rect x="15" y="35" width="70" height="35" rx="15" fill="none" stroke="#ff6b9d" stroke-width="2"/><circle cx="30" cy="52" r="4" fill="#ff6b9d"/><circle cx="40" cy="42" r="4" fill="#ff6b9d"/><circle cx="70" cy="45" r="4" fill="#ff6b9d"/><circle cx="70" cy="60" r="4" fill="#ff6b9d"/></svg>`,
        commands: [
            { cmd: 'chess', desc: 'Chess Game' },
            { cmd: 'car', desc: 'Highway Rush' },
            { cmd: 'dino', desc: 'Chrome Dino' },
            { cmd: 'flappy', desc: 'Flappy Bird' },
            { cmd: 'galaxy', desc: 'Galaxy Attack' }
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
    desc: 'Premium themed HTML menu with categories',
    category: 'main',
    react: '🎨',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '🎨', key: mek.key }
        });

        const randomResId = crypto.randomUUID();
        const randomBotResId = crypto.randomUUID();

        const userName = m.pushName || 'User';
        const now = new Date();
        const timeStr = now.toLocaleString('en-US', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        // ─────────────────────────────────────
        //  Build main category cards HTML (server-side)
        // ─────────────────────────────────────
        let mainCards = '';
        const catKeys = Object.keys(CATEGORIES);
        for (const key of catKeys) {
            const c = CATEGORIES[key];
            const count = c.commands.length;
            mainCards += `<div class="mc" data-cat="${key}" style="border-color:${c.pC};box-shadow:0 4px 20px ${c.sC},inset 0 0 30px ${c.sC}">
                <div class="mc-icon">${c.pS}</div>
                <div class="mc-label" style="color:${c.pC}">${c.name}</div>
                <div class="mc-count" style="background:${c.sC};color:${c.pC}">${count} cmds</div>
            </div>`;
        }

        // ─────────────────────────────────────
        //  Build main view HTML
        // ─────────────────────────────────────
        const mainHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"><style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans','Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{background:#0d001a;color:#fff;overflow-x:hidden;min-height:100vh}
.bg{position:fixed;inset:0;z-index:-1;background:radial-gradient(circle at 20% 30%,rgba(41,98,255,0.3) 0,transparent 50%),radial-gradient(circle at 80% 70%,rgba(156,39,176,0.3) 0,transparent 50%)}
.psvg{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999;opacity:0.6}
.c{padding:12px;z-index:1;max-width:480px;margin:auto}
.h{text-align:center;margin-bottom:14px;padding:14px;background:linear-gradient(180deg,rgba(15,18,26,0.97),rgba(10,12,18,0.97));border:2px solid #1e293b;border-radius:14px}
.hi{display:flex;justify-content:center;margin-bottom:6px}
.hi svg{animation:d 2s ease-in-out infinite alternate}
@keyframes d{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-8px) scale(1.05)}}
h1{font-size:20px;color:#3b82f6;text-shadow:0 0 12px rgba(59,130,246,0.6);letter-spacing:2px;text-transform:uppercase}
p{color:#8c9eff;font-size:11px;margin-top:4px;letter-spacing:1px}
.info{display:flex;justify-content:space-around;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(255,255,255,0.1)}
.info>div{text-align:center}
.info .lbl{font-size:8px;color:#64748b;letter-spacing:1px;font-weight:700;text-transform:uppercase}
.info .val{font-size:11px;color:#fff;font-weight:800;margin-top:2px}
.cl{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mc{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:rgba(15,18,26,0.95);border:2px solid;padding:14px 8px;border-radius:14px;cursor:pointer;transition:transform 0.12s ease,background 0.2s;position:relative;overflow:hidden}
.mc:active{transform:scale(0.94);background:rgba(59,130,246,0.15)}
.mc-icon{font-size:26px;margin-bottom:6px}
.mc-label{font-size:11px;font-weight:900;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px}
.mc-count{font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:6px}
.f{text-align:center;color:#555;font-size:10px;padding:14px 0;letter-spacing:1.5px;text-transform:uppercase}
.f span{color:#3b82f6;font-weight:900;text-shadow:0 0 10px rgba(59,130,246,0.5)}
.fs{animation:fade 0.3s ease-out}
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.pop{position:fixed;background:#10b981;color:#fff;padding:5px 10px;border-radius:10px;font-size:11px;font-weight:800;pointer-events:none;transition:0.4s;z-index:9999}
.pa{opacity:0;transform:translateY(-30px)}
</style></head><body>
<div class="bg"></div>
<svg class="psvg" id="psvg"></svg>
<div class="c">
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

  // Floating particles
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

  function popup(x, y) {
    var p = document.createElement('div');
    p.innerText = 'Copied!';
    p.className = 'pop';
    p.style.left = (x - 20) + 'px';
    p.style.top = (y - 20) + 'px';
    document.body.appendChild(p);
    setTimeout(function(){ p.classList.add('pa'); }, 10);
    setTimeout(function(){ p.remove(); }, 500);
  }

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
    popup(x, y);
  }

  // Main cards click → show category (inline view swap)
  document.getElementById('cl').onclick = function(e) {
    var card = e.target.closest('.mc');
    if (!card) return;
    var key = card.getAttribute('data-cat');
    var data = allData[key];
    if (!data) return;
    var theme = catThemes[key];
    renderCategory(data, theme, key);
  };

  function renderCategory(data, theme, key) {
    var wrap = document.querySelector('.c');
    var html = '<div class="h" style="border-color:' + theme.pC + '">' +
      '<div class="hi"><span style="font-size:40px">' + theme.pS + '</span></div>' +
      '<h1 style="color:' + theme.pC + ';text-shadow:0 0 12px ' + theme.pC + '">' + data.name.toUpperCase() + '</h1>' +
      '<p>' + data.cmds.length + ' commands available</p>' +
      '</div>' +
      '<div style="display:flex;justify-content:center;margin-bottom:10px">' +
      '<button id="backBtn" style="padding:10px 20px;border-radius:10px;border:2px solid ' + theme.pC + ';background:rgba(15,18,26,0.95);color:' + theme.pC + ';font-weight:900;font-size:12px;letter-spacing:1px;cursor:pointer">◀ BACK</button>' +
      '</div>' +
      '<div class="cl" id="cmdList">';

    for (var i = 0; i < data.cmds.length; i++) {
      var cmd = data.cmds[i];
      var desc = cmd.desc.length > 25 ? cmd.desc.substring(0, 22) + '..' : cmd.desc;
      var full = prefix + cmd.cmd;
      html += '<div class="mc cr" data-cmd="' + full + '" style="border-color:' + theme.pC + '">' +
        '<div class="mc-label" style="color:' + theme.pC + '">' + cmd.cmd.toUpperCase() + '</div>' +
        '<i style="font-size:9px;color:#aaa;font-style:normal;line-height:1.2;padding:0 4px">' + desc + '</i>' +
        '<span style="background:#0009;padding:3px 8px;border-radius:4px;font-family:monospace;font-size:10px;color:' + theme.pC + ';border:1px solid #fff2;margin-top:4px">' + full + '</span>' +
        '</div>';
    }
    html += '</div><div class="f">Engineered by <span>SAVENDRA DAMPRiya</span> ⚡</div>';

    wrap.innerHTML = html;
    wrap.classList.add('fs');

    // Copy handler
    document.getElementById('cmdList').onclick = function(ev) {
      var item = ev.target.closest('.cr');
      if (!item) return;
      var txt = item.getAttribute('data-cmd');
      if (txt) copy(txt, ev.clientX, ev.clientY);
    };

    // Back
    document.getElementById('backBtn').onclick = function() {
      location.reload();
    };
  }
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

        const { generateWAMessageFromContent } = require('baileys');

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
