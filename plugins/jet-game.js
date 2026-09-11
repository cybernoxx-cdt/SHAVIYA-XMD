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

cmd({
    pattern:  'galaxy',
    alias:    ['space', 'shooter', 'galaxyattack', 'alien'],
    desc:     'Play Galaxy Attack - Space Shooter inside WhatsApp',
    category: 'game',
    react:    '👾',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '👾', key: mek.key }
        });

        // ⚠️ DO NOT CHANGE A SINGLE CHARACTER IN THIS HTML.
        // Any modification will break the verification signature.
        const gameHtml = `<style>
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; touch-action: none; overflow: hidden; }
.wrapper { width: 100%; max-width: 480px; margin: auto; padding: 12px; }
.card { background: linear-gradient(180deg, rgba(8,10,24,0.98), rgba(4,6,16,0.98)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 2px solid #8b5cf6; border-radius: 20px; overflow: hidden; box-shadow: 0 14px 44px rgba(0,0,0,0.8), inset 0 0 40px rgba(139,92,246,0.08); padding: 12px; position: relative; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.title { font-size: 10px; letter-spacing: 1.5px; color: #8b5cf6; font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px; }
.title .dot{ width:6px; height:6px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981; animation: pulse 1.4s infinite; }
@keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.3} }
.score-badge { font-size: 20px; font-weight: 900; color: #fbbf24; text-shadow: 0 0 12px rgba(251,191,36,0.6); font-variant-numeric: tabular-nums; }
.best-badge { font-size: 10px; color: #94a3b8; font-variant-numeric: tabular-nums; }
.stat-row { display:flex; gap:6px; margin-bottom: 6px; }
.stat-pill { flex:1; background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.25); border-radius:10px; padding:5px 6px; text-align:center; }
.stat-pill .lbl{ font-size:8px; letter-spacing:1px; color:#a78bfa; text-transform:uppercase; font-weight:700; }
.stat-pill .val{ font-size:13px; font-weight:900; color:#fff; font-variant-numeric: tabular-nums; }
.hp-row { display:flex; align-items:center; gap:8px; margin-bottom: 8px; padding: 6px 10px; background: rgba(0,0,0,0.4); border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); }
.hp-label { font-size: 9px; font-weight: 800; letter-spacing: 1px; color: #ef4444; text-transform: uppercase; }
.hp-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
.hp-fill { height: 100%; width: 100%; background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981); background-size: 200% 100%; transition: width 0.2s; border-radius: 4px; }
.hp-text { font-size: 10px; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; min-width: 60px; text-align: right; }
#game-container { position: relative; width: 100%; height: 380px; border-radius: 14px; overflow: hidden; border: 2px solid #1e1b4b; box-shadow: inset 0 0 30px rgba(0,0,0,0.8); }
canvas { width: 100%; height: 100%; display: block; background: #000; }
.controls { display: grid; grid-template-columns: 1fr 1.4fr 1fr; gap: 8px; margin-top: 10px; }
.btn { padding: 12px 8px; font-size: 14px; font-weight: 800; border: none; border-radius: 12px; cursor: pointer; color: #fff; text-align: center; letter-spacing: 0.5px; }
.btn-left { background: linear-gradient(135deg, #3b82f6, #1e40af); box-shadow: 0 4px 14px rgba(59,130,246,0.4); }
.btn-right { background: linear-gradient(135deg, #3b82f6, #1e40af); box-shadow: 0 4px 14px rgba(59,130,246,0.4); }
.btn-fire { background: linear-gradient(135deg, #ef4444, #b91c1c); box-shadow: 0 4px 14px rgba(239,68,68,0.5); }
.btn:active { transform: scale(0.95); filter: brightness(0.9); }
.hint { margin-top: 6px; text-align: center; font-size: 9px; color: #64748b; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; }
.credit-bar { margin-top: 8px; text-align: center; font-size: 9px; font-weight: 700; letter-spacing: 1.2px; color: #64748b; text-transform: uppercase; }
.credit-bar span { color: #8b5cf6; font-weight: 900; text-shadow: 0 0 8px rgba(139,92,246,0.6); }
</style>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div>
        <div class="title"><span class="dot"></span>SHAVIYA XMD</div>
        <h2 style="font-size: 17px; font-weight: 900; color: #fff; margin-top:2px;">Galaxy Attack 👾</h2>
      </div>
      <div style="text-align: right;">
        <div class="score-badge" id="score">00000</div>
        <div class="best-badge" id="best">BEST 00000</div>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-pill"><div class="lbl">Wave</div><div class="val" id="waveStat">1</div></div>
      <div class="stat-pill"><div class="lbl">Kills</div><div class="val" id="killStat">0</div></div>
      <div class="stat-pill"><div class="lbl">Power</div><div class="val" id="powStat">1</div></div>
    </div>

    <div class="hp-row">
      <div class="hp-label">HP</div>
      <div class="hp-bar"><div class="hp-fill" id="hpFill"></div></div>
      <div class="hp-text" id="hpText">100 / 100</div>
    </div>

    <div id="game-container">
      <canvas id="c"></canvas>
    </div>

    <div class="controls">
      <button class="btn btn-left" id="leftBtn">◀</button>
      <button class="btn btn-fire" id="fireBtn">🔥 FIRE</button>
      <button class="btn btn-right" id="rightBtn">▶</button>
    </div>

    <div class="hint">Drag ship · Auto-fire · Or use buttons</div>

    <div class="credit-bar">Developed by <span>Savendra Dampriya</span></div>
  </div>
</div>

<script>
(function() {
  var cvs = document.getElementById('c');
  var ctx = cvs.getContext('2d');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var waveStatEl = document.getElementById('waveStat');
  var killStatEl = document.getElementById('killStat');
  var powStatEl = document.getElementById('powStat');
  var hpFill = document.getElementById('hpFill');
  var hpText = document.getElementById('hpText');

  var W = 360, H = 380;
  cvs.width = W;
  cvs.height = H;

  var stars = [];
  for (var i = 0; i < 90; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random(),
      size: 0.4 + Math.random() * 1.6
    });
  }

  var nebulas = [];
  for (var ni = 0; ni < 4; ni++) {
    nebulas.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 40 + Math.random() * 60,
      hue: [260, 300, 200, 340][ni],
      spd: 0.05 + Math.random() * 0.1
    });
  }

  var player = {
    x: W / 2, y: H - 50,
    tx: W / 2, ty: H - 50,
    r: 12,
    hp: 100, maxHp: 100,
    invuln: 0,
    power: 1,
    cool: 0,
    fireCool: 14,
    alive: true
  };

  var bullets = [];
  var eBullets = [];
  var enemies = [];
  var powerups = [];
  var particles = [];
  var popups = [];

  var score = 0, best = 0, kills = 0, wave = 1;
  var frame = 0;
  var spawnTimer = 0;
  var waveTimer = 0;
  var inWave = true;
  var gameOver = false;
  var shake = 0;
  var flashAlpha = 0;
  var autoFire = true;
  var moveL = false, moveR = false;

  try { best = parseInt(localStorage.getItem('galaxy_best_v1') || '0', 10) || 0; } catch(e){}
  bestEl.textContent = 'BEST ' + String(best).padStart(5, '0');

  var PALETTE = {
    green:  { body: '#10b981', dark: '#065f46', light: '#6ee7b7' },
    yellow: { body: '#fbbf24', dark: '#92400e', light: '#fde68a' },
    orange: { body: '#f97316', dark: '#9a3412', light: '#fdba74' },
    pink:   { body: '#ec4899', dark: '#831843', light: '#f9a8d4' },
    purple: { body: '#a855f7', dark: '#581c87', light: '#d8b4fe' },
    cyan:   { body: '#06b6d4', dark: '#155e75', light: '#67e8f9' }
  };
  var PAL_KEYS = Object.keys(PALETTE);

  function reset() {
    player.x = W / 2; player.y = H - 50;
    player.tx = W / 2; player.ty = H - 50;
    player.hp = player.maxHp;
    player.invuln = 0;
    player.power = 1;
    player.cool = 0;
    player.alive = true;
    bullets = []; eBullets = []; enemies = []; powerups = []; particles = []; popups = [];
    score = 0; kills = 0; wave = 1;
    frame = 0; spawnTimer = 0; waveTimer = 0;
    inWave = true; gameOver = false; shake = 0; flashAlpha = 0;
    updateHUD();
    scoreEl.textContent = '00000';
    waveStatEl.textContent = '1';
    killStatEl.textContent = '0';
    powStatEl.textContent = '1';
  }

  function updateHUD() {
    hpFill.style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%';
    hpText.textContent = Math.max(0, Math.round(player.hp)) + ' / ' + player.maxHp;
  }

  function spawnEnemy() {
    var r = Math.random();
    var type, w, h, hp, speed, pts;
    if (r < 0.55) { type = 'grunt'; w = 26; h = 26; hp = 1; speed = 1.2 + wave * 0.1; pts = 10; }
    else if (r < 0.85) { type = 'tank'; w = 34; h = 30; hp = 2 + Math.floor(wave / 3); speed = 0.8 + wave * 0.08; pts = 20; }
    else { type = 'zigzag'; w = 24; h = 24; hp = 2; speed = 1.6 + wave * 0.1; pts = 25; }

    var colorKey = PAL_KEYS[Math.floor(Math.random() * PAL_KEYS.length)];
    var ex = 30 + Math.random() * (W - 60);

    enemies.push({
      type: type,
      x: ex,
      y: -30,
      w: w, h: h,
      hp: hp, maxHp: hp,
      speed: speed,
      color: PALETTE[colorKey],
      colorKey: colorKey,
      pts: pts,
      t: 0,
      baseX: ex,
      shootCool: Math.floor(60 + Math.random() * 80),
      hitFlash: 0
    });
  }

  function spawnBoss() {
    var hp = 20 + wave * 5;
    enemies.push({
      type: 'boss',
      x: W / 2,
      y: -80,
      w: 100, h: 70,
      hp: hp, maxHp: hp,
      speed: 0.5,
      color: PALETTE.purple,
      colorKey: 'purple',
      pts: 200,
      t: 0,
      baseX: W / 2,
      phase: 0,
      shootCool: 40,
      hitFlash: 0
    });
  }

  function spawnPowerup(x, y) {
    var kinds = ['hp', 'power', 'shield'];
    var k = kinds[Math.floor(Math.random() * kinds.length)];
    powerups.push({ x: x, y: y, kind: k, t: 0, vy: 1.4 });
  }

  function shoot() {
    if (player.cool > 0 || !player.alive) return;
    player.cool = player.fireCool;
    var p = player.power;
    var y = player.y - 20;
    var bulletsToShoot = [];
    if (p === 1) {
      bulletsToShoot.push({ x: player.x, y: y, vx: 0, vy: -8 });
    } else if (p === 2) {
      bulletsToShoot.push({ x: player.x - 6, y: y, vx: 0, vy: -8.5 });
      bulletsToShoot.push({ x: player.x + 6, y: y, vx: 0, vy: -8.5 });
    } else if (p === 3) {
      bulletsToShoot.push({ x: player.x, y: y, vx: 0, vy: -9 });
      bulletsToShoot.push({ x: player.x - 8, y: y + 4, vx: -1.4, vy: -8 });
      bulletsToShoot.push({ x: player.x + 8, y: y + 4, vx: 1.4, vy: -8 });
    } else {
      bulletsToShoot.push({ x: player.x, y: y, vx: 0, vy: -9 });
      bulletsToShoot.push({ x: player.x - 8, y: y + 4, vx: -1.8, vy: -8 });
      bulletsToShoot.push({ x: player.x + 8, y: y + 4, vx: 1.8, vy: -8 });
      bulletsToShoot.push({ x: player.x - 12, y: y + 8, vx: -2.6, vy: -7 });
      bulletsToShoot.push({ x: player.x + 12, y: y + 8, vx: 2.6, vy: -7 });
    }
    for (var i = 0; i < bulletsToShoot.length; i++) {
      bullets.push(bulletsToShoot[i]);
    }
  }

  function enemyShoot(e) {
    var dx = player.x - e.x;
    var dy = player.y - e.y;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var sp = 2.2 + wave * 0.06;
    eBullets.push({
      x: e.x, y: e.y + 12,
      vx: (dx / d) * sp,
      vy: (dy / d) * sp,
      r: 4,
      color: e.type === 'boss' ? '#f472b6' : '#f87171'
    });
  }

  function explode(x, y, color, count) {
    count = count || 14;
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 1.5 + Math.random() * 4;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        size: 1.5 + Math.random() * 2.5,
        color: color
      });
    }
  }

  function addPopup(x, y, text, color) {
    popups.push({ x: x, y: y, text: text, life: 1, color: color });
  }

  function damageEnemy(e, dmg) {
    e.hp -= dmg;
    e.hitFlash = 6;
    if (e.hp <= 0) {
      explode(e.x, e.y, e.color.body, e.type === 'boss' ? 60 : 18);
      score += e.pts;
      kills++;
      scoreEl.textContent = String(score).padStart(5, '0');
      killStatEl.textContent = kills;
      addPopup(e.x, e.y, '+' + e.pts, e.color.light);
      shake = e.type === 'boss' ? 14 : 4;
      if (score > best) {
        best = score;
        try { localStorage.setItem('galaxy_best_v1', String(best)); } catch(err){}
        bestEl.textContent = 'BEST ' + String(best).padStart(5, '0');
      }
      // Drop powerup
      if (Math.random() < (e.type === 'boss' ? 0.9 : 0.12)) spawnPowerup(e.x, e.y);
      return true;
    }
    return false;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground() {
    ctx.fillStyle = '#03040d';
    ctx.fillRect(0, 0, W, H);

    // Nebula blobs
    for (var i = 0; i < nebulas.length; i++) {
      var n = nebulas[i];
      if (!gameOver) {
        n.y += n.spd;
        if (n.y - n.r > H) { n.y = -n.r; n.x = Math.random() * W; }
      }
      var grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, 'hsla(' + n.hue + ', 70%, 50%, 0.15)');
      grad.addColorStop(1, 'hsla(' + n.hue + ', 70%, 50%, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stars (parallax)
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      if (!gameOver) {
        st.y += 0.4 + st.z * 3;
        if (st.y > H) { st.y = -2; st.x = Math.random() * W; }
      }
      ctx.globalAlpha = 0.3 + st.z * 0.7;
      ctx.fillStyle = '#fff';
      ctx.fillRect(st.x, st.y, st.size, st.size);
    }
    ctx.globalAlpha = 1;

    // Distant planet
    var planetX = W - 60;
    var planetY = 60 + Math.sin(frame * 0.005) * 8;
    var pg = ctx.createRadialGradient(planetX - 8, planetY - 8, 4, planetX, planetY, 40);
    pg.addColorStop(0, '#a78bfa');
    pg.addColorStop(0.5, '#7c3aed');
    pg.addColorStop(1, '#2e1065');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 32, 0, Math.PI * 2);
    ctx.fill();
    // Planet ring
    ctx.strokeStyle = 'rgba(196,181,253,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 44, 8, -0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawPlayer() {
    if (!player.alive) return;
    if (player.invuln > 0 && frame % 6 < 3) return;

    var x = player.x, y = player.y;
    ctx.save();

    // Glow
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#38bdf8';

    // Thruster flames (animated)
    var flame = 6 + Math.sin(frame * 0.7) * 4;
    var fg = ctx.createLinearGradient(x, y + 10, x, y + 16 + flame);
    fg.addColorStop(0, '#fbbf24');
    fg.addColorStop(0.5, '#f97316');
    fg.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 12);
    ctx.lineTo(x, y + 16 + flame);
    ctx.lineTo(x + 5, y + 12);
    ctx.closePath();
    ctx.fill();

    // Main hull
    var hg = ctx.createLinearGradient(x - 12, y - 18, x + 12, y + 14);
    hg.addColorStop(0, '#67e8f9');
    hg.addColorStop(0.5, '#0ea5e9');
    hg.addColorStop(1, '#0369a1');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x - 4, y - 6);
    ctx.lineTo(x - 13, y + 6);
    ctx.lineTo(x - 6, y + 6);
    ctx.lineTo(x - 8, y + 14);
    ctx.lineTo(x - 2, y + 11);
    ctx.lineTo(x, y + 16);
    ctx.lineTo(x + 2, y + 11);
    ctx.lineTo(x + 8, y + 14);
    ctx.lineTo(x + 6, y + 6);
    ctx.lineTo(x + 13, y + 6);
    ctx.lineTo(x + 4, y - 6);
    ctx.closePath();
    ctx.fill();

    // Edge highlight
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit
    var cg = ctx.createRadialGradient(x, y - 6, 0, x, y - 6, 6);
    cg.addColorStop(0, '#fff');
    cg.addColorStop(0.5, '#67e8f9');
    cg.addColorStop(1, '#0891b2');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(x, y - 6, 3.2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing lights
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fbbf24';
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x - 10, y + 6, 1.6, 0, Math.PI * 2);
    ctx.arc(x + 10, y + 6, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Shield bubble
    if (player.invuln > 0) {
      ctx.strokeStyle = 'rgba(56,189,248,' + (0.4 + Math.sin(frame * 0.3) * 0.2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEnemy(e) {
    var x = e.x, y = e.y, w = e.w, h = e.h;
    var c = e.color;
    var flash = e.hitFlash > 0;

    ctx.save();

    // Glow
    ctx.shadowBlur = 14;
    ctx.shadowColor = c.body;

    if (e.type === 'boss') {
      // Boss saucer
      ctx.fillStyle = flash ? '#fff' : c.body;
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Dome
      var dg = ctx.createRadialGradient(x - 8, y - 12, 2, x, y - 10, 22);
      dg.addColorStop(0, c.light);
      dg.addColorStop(1, c.dark);
      ctx.fillStyle = flash ? '#fff' : dg;
      ctx.beginPath();
      ctx.arc(x, y - 10, 22, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x - 8, y - 2, 3, 0, Math.PI * 2);
      ctx.arc(x + 8, y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(x - 8, y - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(x + 8, y - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Mouth
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 8, 10, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      // Lights under
      for (var l = -2; l <= 2; l++) {
        ctx.fillStyle = frame % 20 < 10 ? '#fbbf24' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(x + l * 14, y + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // HP bar
      var hpw = 80;
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x - hpw / 2, y - 55, hpw, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - hpw / 2, y - 55, hpw * (e.hp / e.maxHp), 5);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - hpw / 2, y - 55, hpw, 5);
    } else {
      // Regular alien - body
      ctx.fillStyle = flash ? '#fff' : c.body;
      // Body (rounded top, tapered bottom)
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y + h / 2 - 4);
      ctx.quadraticCurveTo(x - w / 2 - 3, y - h / 2, x, y - h / 2);
      ctx.quadraticCurveTo(x + w / 2 + 3, y - h / 2, x + w / 2, y + h / 2 - 4);
      ctx.quadraticCurveTo(x + w / 2 - 2, y + h / 2, x + w / 2 - 6, y + h / 2);
      ctx.lineTo(x - w / 2 + 6, y + h / 2);
      ctx.quadraticCurveTo(x - w / 2 + 2, y + h / 2, x - w / 2, y + h / 2 - 4);
      ctx.closePath();
      ctx.fill();

      // Top highlight
      ctx.fillStyle = flash ? '#fff' : c.light;
      ctx.beginPath();
      ctx.ellipse(x, y - h / 3, w / 3.4, h / 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes (white + pupil)
      var eyeY = y - 2;
      var eyeOff = w / 4.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x - eyeOff, eyeY, 3.2, 0, Math.PI * 2);
      ctx.arc(x + eyeOff, eyeY, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x - eyeOff + 0.6, eyeY + 0.5, 1.8, 0, Math.PI * 2);
      ctx.arc(x + eyeOff + 0.6, eyeY + 0.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      // Eye shine
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x - eyeOff - 0.5, eyeY - 0.6, 0.7, 0, Math.PI * 2);
      ctx.arc(x + eyeOff - 0.5, eyeY - 0.6, 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      var mouthY = y + h / 5;
      if (e.type === 'tank') {
        // Angry mouth (zigzag)
        ctx.moveTo(x - 6, mouthY);
        ctx.lineTo(x - 3, mouthY + 3);
        ctx.lineTo(x, mouthY);
        ctx.lineTo(x + 3, mouthY + 3);
        ctx.lineTo(x + 6, mouthY);
      } else if (e.type === 'zigzag') {
        // O mouth
        ctx.arc(x, mouthY, 3, 0, Math.PI * 2);
      } else {
        // Smile
        ctx.arc(x, mouthY - 1, 4, 0, Math.PI);
      }
      ctx.stroke();

      // Antennas
      ctx.strokeStyle = c.dark;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - w / 3, y - h / 2 + 2);
      ctx.lineTo(x - w / 3 - 3, y - h / 2 - 4);
      ctx.moveTo(x + w / 3, y - h / 2 + 2);
      ctx.lineTo(x + w / 3 + 3, y - h / 2 - 4);
      ctx.stroke();
      ctx.fillStyle = frame % 20 < 10 ? '#fbbf24' : '#f43f5e';
      ctx.beginPath();
      ctx.arc(x - w / 3 - 3, y - h / 2 - 4, 2, 0, Math.PI * 2);
      ctx.arc(x + w / 3 + 3, y - h / 2 - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawPowerup(p) {
    var colors = { hp: '#10b981', power: '#fbbf24', shield: '#38bdf8' };
    var icons = { hp: '+', power: '⚡', shield: '🛡' };
    var c = colors[p.kind];
    var pulse = 0.8 + Math.sin(p.t * 0.2) * 0.2;

    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = c;
    ctx.translate(p.x, p.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.font = '900 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.kind === 'hp' ? '+' : p.kind === 'power' ? 'P' : 'S', 0, 0);
    ctx.restore();
  }

  function update() {
    frame++;
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      shake *= 0.85;
      if (shake < 0.5) shake = 0;
    }

    drawBackground();

    // Wave progression
    if (!gameOver && player.alive) {
      waveTimer++;
      var waveLen = 480;
      if (waveTimer > waveLen && enemies.length === 0) {
        wave++;
        waveStatEl.textContent = wave;
        waveTimer = 0;
        addPopup(W / 2, H / 2, 'WAVE ' + wave, '#a78bfa');
        if (wave % 5 === 0) spawnBoss();
      }
    }

    // Input - button movement
    if (!gameOver && player.alive) {
      if (moveL) player.tx -= 5;
      if (moveR) player.tx += 5;
      if (player.tx < 20) player.tx = 20;
      if (player.tx > W - 20) player.tx = W - 20;

      // Smooth follow
      player.x += (player.tx - player.x) * 0.28;
      player.y += (player.ty - player.y) * 0.28;

      // Auto-fire
      if (autoFire) shoot();
      player.cool = Math.max(0, player.cool - 1);
      if (player.invuln > 0) player.invuln--;
    }

    // Spawn enemies
    if (!gameOver && player.alive) {
      spawnTimer++;
      var spawnRate = Math.max(30, 70 - wave * 4);
      if (spawnTimer > spawnRate && enemies.length < 12) {
        spawnEnemy();
        spawnTimer = 0;
        if (wave > 3 && Math.random() < 0.3) spawnEnemy();
      }
    }

    // Player bullets
    for (var b = bullets.length - 1; b >= 0; b--) {
      var bl = bullets[b];
      bl.x += bl.vx;
      bl.y += bl.vy;
      if (bl.y < -10 || bl.x < -10 || bl.x > W + 10) { bullets.splice(b, 1); continue; }

      // Draw bullet
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#67e8f9';
      var bg = ctx.createLinearGradient(bl.x, bl.y - 8, bl.x, bl.y + 4);
      bg.addColorStop(0, '#fff');
      bg.addColorStop(0.5, '#67e8f9');
      bg.addColorStop(1, '#0891b2');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(bl.x, bl.y, 2.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Collision with enemies
      for (var ei = enemies.length - 1; ei >= 0; ei--) {
        var e = enemies[ei];
        if (Math.abs(bl.x - e.x) < e.w / 2 && Math.abs(bl.y - e.y) < e.h / 2 + 4) {
          bullets.splice(b, 1);
          if (damageEnemy(e, 1)) {
            enemies.splice(ei, 1);
          }
          break;
        }
      }
    }

    // Enemies
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      e.t++;
      if (e.hitFlash > 0) e.hitFlash--;

      if (e.type === 'boss') {
        if (e.y < 70) e.y += 1;
        else {
          e.x = W / 2 + Math.sin(e.t * 0.02) * (W / 2 - 60);
        }
      } else if (e.type === 'zigzag') {
        e.y += e.speed;
        e.x = e.baseX + Math.sin(e.t * 0.08) * 40;
      } else {
        e.y += e.speed;
      }

      drawEnemy(e);

      // Shoot
      if (e.y > 20 && e.y < H - 60) {
        e.shootCool--;
        if (e.shootCool <= 0) {
          enemyShoot(e);
          e.shootCool = e.type === 'boss' ? 20 : Math.floor(80 + Math.random() * 60 - wave * 2);
        }
      }

      // Collision with player
      if (player.alive && player.invuln <= 0) {
        var dx = player.x - e.x;
        var dy = player.y - e.y;
        if (Math.abs(dx) < e.w / 2 + 8 && Math.abs(dy) < e.h / 2 + 8) {
          player.hp -= e.type === 'boss' ? 40 : 25;
          player.invuln = 90;
          updateHUD();
          explode(player.x, player.y, '#38bdf8', 20);
          if (e.type !== 'boss') {
            explode(e.x, e.y, e.color.body);
            enemies.splice(i, 1);
          }
          if (player.hp <= 0) {
            player.alive = false;
            gameOver = true;
            explode(player.x, player.y, '#f59e0b', 60);
            shake = 18;
          }
          continue;
        }
      }

      // Off-screen
      if (e.y > H + 60 && e.type !== 'boss') {
        enemies.splice(i, 1);
      }
    }

    // Enemy bullets
    for (var eb = eBullets.length - 1; eb >= 0; eb--) {
      var ebl = eBullets[eb];
      ebl.x += ebl.vx;
      ebl.y += ebl.vy;
      if (ebl.y < -10 || ebl.y > H + 10 || ebl.x < -10 || ebl.x > W + 10) {
        eBullets.splice(eb, 1);
        continue;
      }

      // Draw
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = ebl.color;
      var eg = ctx.createRadialGradient(ebl.x, ebl.y, 0, ebl.x, ebl.y, ebl.r);
      eg.addColorStop(0, '#fff');
      eg.addColorStop(0.5, ebl.color);
      eg.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(ebl.x, ebl.y, ebl.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Hit player
      if (player.alive && player.invuln <= 0) {
        var pdx = player.x - ebl.x;
        var pdy = player.y - ebl.y;
        if (pdx * pdx + pdy * pdy < (8 + ebl.r) * (8 + ebl.r)) {
          player.hp -= 10;
          player.invuln = 40;
          updateHUD();
          explode(ebl.x, ebl.y, '#f87171', 8);
          eBullets.splice(eb, 1);
          if (player.hp <= 0) {
            player.alive = false;
            gameOver = true;
            explode(player.x, player.y, '#f59e0b', 60);
            shake = 18;
          }
          continue;
        }
      }
    }

    // Powerups
    for (var p = powerups.length - 1; p >= 0; p--) {
      var pu = powerups[p];
      pu.t++;
      pu.y += pu.vy;
      if (pu.y > H + 20) { powerups.splice(p, 1); continue; }
      drawPowerup(pu);

      // Pickup
      if (player.alive) {
        var pdx2 = player.x - pu.x;
        var pdy2 = player.y - pu.y;
        if (pdx2 * pdx2 + pdy2 * pdy2 < 22 * 22) {
          if (pu.kind === 'hp') {
            player.hp = Math.min(player.maxHp, player.hp + 25);
            updateHUD();
            addPopup(player.x, player.y - 20, '+25 HP', '#10b981');
          } else if (pu.kind === 'power') {
            player.power = Math.min(4, player.power + 1);
            powStatEl.textContent = player.power;
            addPopup(player.x, player.y - 20, 'POWER UP', '#fbbf24');
          } else if (pu.kind === 'shield') {
            player.invuln = 180;
            addPopup(player.x, player.y - 20, 'SHIELD', '#38bdf8');
          }
          explode(pu.x, pu.y, '#fff', 12);
          powerups.splice(p, 1);
        }
      }
    }

    // Player
    if (player.alive) drawPlayer();

    // Particles
    for (var pi = particles.length - 1; pi >= 0; pi--) {
      var pt = particles[pi];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.97;
      pt.vy *= 0.97;
      pt.life -= 0.025;
      if (pt.life <= 0) { particles.splice(pi, 1); continue; }
      ctx.globalAlpha = Math.max(pt.life, 0);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Popups
    for (var pop = popups.length - 1; pop >= 0; pop--) {
      var po = popups[pop];
      po.y -= 0.6;
      po.life -= 0.018;
      if (po.life <= 0) { popups.splice(pop, 1); continue; }
      ctx.globalAlpha = po.life;
      ctx.fillStyle = po.color;
      ctx.font = '900 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 10;
      ctx.shadowColor = po.color;
      ctx.fillText(po.text, po.x, po.y);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Flash
    if (flashAlpha > 0.01) {
      ctx.fillStyle = 'rgba(255,255,255,' + flashAlpha + ')';
      ctx.fillRect(0, 0, W, H);
      flashAlpha *= 0.85;
    }

    // Game over
    if (gameOver) {
      ctx.fillStyle = 'rgba(3,4,13,0.88)';
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = 'center';

      ctx.fillStyle = '#ef4444';
      ctx.font = '900 26px sans-serif';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 50);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = '900 18px sans-serif';
      ctx.fillText('Score: ' + score, W / 2, H / 2 - 10);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '800 13px sans-serif';
      ctx.fillText('🪙 Best: ' + best, W / 2, H / 2 + 14);

      ctx.fillStyle = '#a78bfa';
      ctx.font = '700 12px sans-serif';
      ctx.fillText('Wave: ' + wave + '  •  Kills: ' + kills, W / 2, H / 2 + 34);

      ctx.fillStyle = '#10b981';
      ctx.font = '900 14px sans-serif';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#10b981';
      ctx.fillText('TAP TO PLAY AGAIN', W / 2, H / 2 + 70);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    requestAnimationFrame(update);
  }

  function restart() {
    reset();
  }

  // Canvas touch/drag
  var dragging = false;
  function handleDown(e) {
    e.preventDefault();
    if (gameOver) { restart(); return; }
    dragging = true;
    var rect = cvs.getBoundingClientRect();
    var clientX, clientY;
    if (e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    player.tx = (clientX - rect.left) * (W / rect.width);
    player.ty = Math.max(H * 0.15, (clientY - rect.top) * (H / rect.height));
  }
  function handleMove(e) {
    if (!dragging || gameOver) return;
    e.preventDefault();
    var rect = cvs.getBoundingClientRect();
    var clientX, clientY;
    if (e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    player.tx = Math.max(20, Math.min(W - 20, (clientX - rect.left) * (W / rect.width)));
    player.ty = Math.max(H * 0.15, Math.min(H - 30, (clientY - rect.top) * (H / rect.height)));
  }
  function handleUp(e) { dragging = false; }

  cvs.addEventListener('pointerdown', handleDown);
  cvs.addEventListener('pointermove', handleMove);
  cvs.addEventListener('pointerup', handleUp);
  cvs.addEventListener('pointerleave', handleUp);
  cvs.addEventListener('touchstart', handleDown, { passive: false });
  cvs.addEventListener('touchmove', handleMove, { passive: false });
  cvs.addEventListener('touchend', handleUp);

  // Button controls
  function addBtnHold(id, onDown, onUp) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', function(e) { e.preventDefault(); onDown(); });
    el.addEventListener('pointerup', function(e) { e.preventDefault(); onUp(); });
    el.addEventListener('pointerleave', function(e) { if (onUp) onUp(); });
    el.addEventListener('touchstart', function(e) { e.preventDefault(); onDown(); });
    el.addEventListener('touchend', function(e) { e.preventDefault(); onUp(); });
  }
  addBtnHold('leftBtn', function(){ moveL = true; }, function(){ moveL = false; });
  addBtnHold('rightBtn', function(){ moveR = true; }, function(){ moveR = false; });
  document.getElementById('fireBtn').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    autoFire = !autoFire;
    this.textContent = autoFire ? '🔥 FIRE' : '✋ STOP';
  });
  document.getElementById('fireBtn').addEventListener('touchstart', function(e) {
    e.preventDefault();
    autoFire = !autoFire;
    this.textContent = autoFire ? '🔥 FIRE' : '✋ STOP';
  });

  // Keyboard
  window.addEventListener('keydown', function(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); moveL = true; }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); moveR = true; }
    if (e.code === 'Space') { e.preventDefault(); shoot(); }
  });
  window.addEventListener('keyup', function(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveL = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') moveR = false;
  });

  update();
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
                        submessages: [{ messageType: 2, messageText: "Galaxy Attack 👾" }],
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
        console.error('Galaxy Send Error:', err);
        return reply('❌ Galaxy Attack load error');
    }
});
