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
    pattern:  'jet',
    alias:    ['space', 'shooter', 'galaxyattack', 'alien'],
    desc:     'Galaxy Attack — Jets vs Alien Ships',
    category: 'game',
    react:    '👾',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '👾', key: mek.key } });

        const gameHtml = `<style>
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", sans-serif; color: #fff; touch-action: none; overflow: hidden; }
.wrapper { width: 100%; max-width: 480px; margin: auto; padding: 12px; }
.card { background: linear-gradient(180deg, rgba(8,10,24,0.98), rgba(4,6,16,0.98)); border: 2px solid #8b5cf6; border-radius: 20px; overflow: hidden; box-shadow: 0 14px 44px rgba(0,0,0,0.8), inset 0 0 40px rgba(139,92,246,0.08); padding: 12px; }
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
.hp-fill { height: 100%; width: 100%; background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981); transition: width 0.2s; border-radius: 4px; }
.hp-text { font-size: 10px; font-weight: 800; color: #fff; min-width: 60px; text-align: right; }
#game-container { position: relative; width: 100%; height: 380px; border-radius: 14px; overflow: hidden; border: 2px solid #1e1b4b; box-shadow: inset 0 0 30px rgba(0,0,0,0.8); }
canvas { width: 100%; height: 100%; display: block; background: #000; touch-action: none; }
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
      <div class="stat-pill"><div class="lbl">Rockets</div><div class="val" id="rocketStat">5</div></div>
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
      <button class="btn btn-fire" id="fireBtn">🚀 ROCKET</button>
      <button class="btn btn-right" id="rightBtn">▶</button>
    </div>

    <div class="hint">Drag · Auto-fire · Rocket button</div>

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
  var rocketStatEl = document.getElementById('rocketStat');
  var hpFill = document.getElementById('hpFill');
  var hpText = document.getElementById('hpText');

  var W = 360, H = 380;
  cvs.width = W;
  cvs.height = H;

  // ──────────── Stars & Nebula ────────────
  var stars = [];
  for (var i = 0; i < 100; i++) {
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
      x: Math.random() * W, y: Math.random() * H,
      r: 40 + Math.random() * 70,
      hue: [260, 300, 200, 340][ni],
      spd: 0.05 + Math.random() * 0.1
    });
  }

  // ──────────── Player (Jet) ────────────
  var player = {
    x: W / 2, y: H - 60,
    tx: W / 2, ty: H - 60,
    r: 14,
    hp: 100, maxHp: 100,
    invuln: 0,
    cool: 0,
    fireCool: 14,
    alive: true
  };

  // ──────────── Bullets & Rockets ────────────
  var bullets = [];
  var eBullets = [];
  var rockets = [];
  var enemies = [];
  var particles = [];
  var popups = [];

  var score = 0, best = 0, kills = 0, wave = 1;
  var frame = 0;
  var spawnTimer = 0;
  var waveTimer = 0;
  var gameOver = false;
  var shake = 0;
  var flashAlpha = 0;
  var autoFire = true;
  var moveL = false, moveR = false;
  var rocketAmmo = 5;
  var rocketReload = 0;

  try { best = parseInt(localStorage.getItem('galaxy_best_v3') || '0', 10) || 0; } catch(e){}
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
    player.x = W / 2; player.y = H - 60;
    player.tx = W / 2; player.ty = H - 60;
    player.hp = player.maxHp;
    player.invuln = 0;
    player.cool = 0;
    player.alive = true;
    bullets = []; eBullets = []; rockets = []; enemies = []; particles = []; popups = [];
    score = 0; kills = 0; wave = 1;
    frame = 0; spawnTimer = 0; waveTimer = 0;
    gameOver = false; shake = 0; flashAlpha = 0;
    rocketAmmo = 5;
    rocketReload = 0;
    updateHUD();
    scoreEl.textContent = '00000';
    waveStatEl.textContent = '1';
    killStatEl.textContent = '0';
    rocketStatEl.textContent = '5';
  }

  function updateHUD() {
    hpFill.style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%';
    hpText.textContent = Math.max(0, Math.round(player.hp)) + ' / ' + player.maxHp;
    rocketStatEl.textContent = rocketAmmo;
  }

  // ─────────────────────────────────────
  //  ALIEN SHIPS — Fly in from sides like jets
  // ─────────────────────────────────────
  function spawnEnemy() {
    var r = Math.random();
    var type, w, h, hp, speed, pts, flightType;

    if (r < 0.5) {
      // Grunt — flies in from side, curves down
      type = 'grunt'; w = 30; h = 22; hp = 1; speed = 2.2 + wave * 0.1; pts = 10;
      flightType = Math.random() < 0.5 ? 'fromLeft' : 'fromRight';
    } else if (r < 0.8) {
      // Fighter — S-curve flight
      type = 'fighter'; w = 36; h = 26; hp = 2 + Math.floor(wave / 3); speed = 1.8 + wave * 0.08; pts = 20;
      flightType = 'zigzag';
    } else {
      // Bomber — slow, straight
      type = 'bomber'; w = 44; h = 32; hp = 3 + Math.floor(wave / 2); speed = 1.2 + wave * 0.06; pts = 30;
      flightType = 'straight';
    }

    var colorKey = PAL_KEYS[Math.floor(Math.random() * PAL_KEYS.length)];
    var e;

    if (flightType === 'fromLeft') {
      e = { x: -40, y: 40 + Math.random() * 100, vx: speed, vy: 0.6, side: 'L' };
    } else if (flightType === 'fromRight') {
      e = { x: W + 40, y: 40 + Math.random() * 100, vx: -speed, vy: 0.6, side: 'R' };
    } else if (flightType === 'zigzag') {
      // Comes from side, zigzags across
      var fromLeft = Math.random() < 0.5;
      e = {
        x: fromLeft ? -40 : W + 40,
        y: 60 + Math.random() * 80,
        vx: fromLeft ? speed : -speed,
        vy: 0.3,
        side: fromLeft ? 'L' : 'R'
      };
    } else {
      // Straight down (rare)
      e = { x: 40 + Math.random() * (W - 80), y: -40, vx: 0, vy: speed, side: 'T' };
    }

    enemies.push({
      type: type,
      x: e.x, y: e.y,
      vx: e.vx, vy: e.vy,
      w: w, h: h,
      hp: hp, maxHp: hp,
      color: PALETTE[colorKey],
      colorKey: colorKey,
      pts: pts,
      t: 0,
      flightType: flightType,
      side: e.side,
      baseY: e.y,
      phase: Math.random() * Math.PI * 2,
      shootCool: Math.floor(70 + Math.random() * 80),
      hitFlash: 0,
      engineTrail: 0
    });
  }

  function spawnBoss() {
    var hp = 25 + wave * 5;
    enemies.push({
      type: 'boss',
      x: W / 2,
      y: -90,
      w: 110, h: 80,
      hp: hp, maxHp: hp,
      vx: 1.5, vy: 0.5,
      color: PALETTE.purple,
      colorKey: 'purple',
      pts: 300,
      t: 0,
      flightType: 'boss',
      side: 'T',
      shootCool: 40,
      hitFlash: 0
    });
  }

  // ─────────────────────────────────────
  //  ROCKET LAUNCHER
  // ─────────────────────────────────────
  function launchRocket() {
    if (gameOver || !player.alive) return;
    if (rocketAmmo <= 0) {
      addPopup(player.x, player.y - 30, 'No rockets!', '#ef4444');
      return;
    }
    rocketAmmo--;
    updateHUD();

    // Find nearest enemy
    var nearest = null;
    var minDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < minDist) { minDist = d; nearest = e; }
    }

    rockets.push({
      x: player.x, y: player.y - 20,
      vx: 0, vy: -3,
      target: nearest,
      targetX: nearest ? nearest.x : player.x,
      targetY: nearest ? nearest.y : 0,
      alive: true,
      trail: [],
      smokeTimer: 0
    });

    // Launch particles
    for (var p = 0; p < 12; p++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 2 + Math.random() * 4;
      particles.push({
        x: player.x, y: player.y - 15,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp + 1,
        life: 1, size: 2 + Math.random() * 3,
        color: Math.random() < 0.5 ? '#fbbf24' : '#f97316'
      });
    }
    shake = 5;
  }

  function shoot() {
    if (player.cool > 0 || !player.alive) return;
    player.cool = player.fireCool;
    var y = player.y - 20;
    bullets.push({ x: player.x, y: y, vx: 0, vy: -9 });
    bullets.push({ x: player.x - 8, y: y + 4, vx: -0.5, vy: -8.5 });
    bullets.push({ x: player.x + 8, y: y + 4, vx: 0.5, vy: -8.5 });
  }

  function enemyShoot(e) {
    var dx = player.x - e.x;
    var dy = player.y - e.y;
    var d = Math.hypot(dx, dy) || 1;
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
      explode(e.x, e.y, e.color.body, e.type === 'boss' ? 60 : 20);
      score += e.pts;
      kills++;
      scoreEl.textContent = String(score).padStart(5, '0');
      killStatEl.textContent = kills;
      addPopup(e.x, e.y, '+' + e.pts, e.color.light);
      shake = e.type === 'boss' ? 14 : 4;
      if (score > best) {
        best = score;
        try { localStorage.setItem('galaxy_best_v3', String(best)); } catch(err){}
        bestEl.textContent = 'BEST ' + String(best).padStart(5, '0');
      }
      // Chance to drop rocket ammo
      if (Math.random() < 0.25) {
        rocketAmmo = Math.min(9, rocketAmmo + 1);
        updateHUD();
        addPopup(e.x, e.y - 20, '+1 🚀', '#ef4444');
      }
      return true;
    }
    return false;
  }

  // ─────────────────────────────────────
  //  DRAW BACKGROUND
  // ─────────────────────────────────────
  function drawBackground() {
    ctx.fillStyle = '#03040d';
    ctx.fillRect(0, 0, W, H);

    // Nebulas
    for (var i = 0; i < nebulas.length; i++) {
      var n = nebulas[i];
      if (!gameOver) {
        n.y += n.spd;
        if (n.y - n.r > H) { n.y = -n.r; n.x = Math.random() * W; }
      }
      var grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, 'hsla(' + n.hue + ',70%,50%,0.14)');
      grad.addColorStop(1, 'hsla(' + n.hue + ',70%,50%,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stars parallax
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
    ctx.strokeStyle = 'rgba(196,181,253,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 44, 8, -0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ─────────────────────────────────────
  //  DRAW PLAYER JET
  // ─────────────────────────────────────
  function drawPlayer() {
    if (!player.alive) return;
    if (player.invuln > 0 && frame % 6 < 3) return;

    var x = player.x, y = player.y;
    ctx.save();

    // Thruster flames
    var flame = 6 + Math.sin(frame * 0.7) * 4;
    var fg = ctx.createLinearGradient(x, y + 10, x, y + 16 + flame);
    fg.addColorStop(0, '#fbbf24');
    fg.addColorStop(0.5, '#f97316');
    fg.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 12);
    ctx.lineTo(x, y + 16 + flame);
    ctx.lineTo(x + 6, y + 12);
    ctx.closePath();
    ctx.fill();

    // Main hull
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#38bdf8';
    var hg = ctx.createLinearGradient(x - 12, y - 18, x + 12, y + 14);
    hg.addColorStop(0, '#67e8f9');
    hg.addColorStop(0.5, '#0ea5e9');
    hg.addColorStop(1, '#0369a1');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x - 5, y - 6);
    ctx.lineTo(x - 15, y + 6);
    ctx.lineTo(x - 7, y + 6);
    ctx.lineTo(x - 9, y + 15);
    ctx.lineTo(x - 2, y + 12);
    ctx.lineTo(x, y + 18);
    ctx.lineTo(x + 2, y + 12);
    ctx.lineTo(x + 9, y + 15);
    ctx.lineTo(x + 7, y + 6);
    ctx.lineTo(x + 15, y + 6);
    ctx.lineTo(x + 5, y - 6);
    ctx.closePath();
    ctx.fill();

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
    ctx.ellipse(x, y - 6, 3.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing lights
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fbbf24';
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x - 11, y + 6, 1.8, 0, Math.PI * 2);
    ctx.arc(x + 11, y + 6, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Shield
    if (player.invuln > 0) {
      ctx.strokeStyle = 'rgba(56,189,248,' + (0.4 + Math.sin(frame * 0.3) * 0.2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ─────────────────────────────────────
  //  DRAW ENEMY SHIP (flying alien)
  // ─────────────────────────────────────
  function drawEnemy(e) {
    var x = e.x, y = e.y, w = e.w, h = e.h;
    var c = e.color;
    var flash = e.hitFlash > 0;

    ctx.save();

    if (e.type === 'boss') {
      // Boss saucer
      ctx.shadowBlur = 16;
      ctx.shadowColor = c.body;

      ctx.fillStyle = flash ? '#fff' : c.body;
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 3, 0, 0, Math.PI * 2);
      ctx.fill();

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

      // Bottom lights
      for (var l = -2; l <= 2; l++) {
        ctx.fillStyle = frame % 20 < 10 ? '#fbbf24' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(x + l * 16, y + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // HP bar
      var hpw = 90;
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x - hpw / 2, y - 60, hpw, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - hpw / 2, y - 60, hpw * (e.hp / e.maxHp), 5);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - hpw / 2, y - 60, hpw, 5);

    } else {
      // ═══════ ALIEN SHIP (flying style) ═══════
      // Determine facing direction based on vx
      var facing = e.vx >= 0 ? 1 : -1;
      var flip = e.side === 'R' || (e.flightType === 'zigzag' && e.vx < 0) ? -1 : 1;

      ctx.translate(x, y);
      ctx.scale(flip, 1);

      ctx.shadowBlur = 14;
      ctx.shadowColor = c.body;

      // Engine trail (behind ship)
      var trailAlpha = 0.6 + Math.sin(frame * 0.4 + e.phase) * 0.2;
      ctx.globalAlpha = trailAlpha;
      var trailGrad = ctx.createLinearGradient(flip * (w / 2), 0, flip * (w / 2 + 14), 0);
      trailGrad.addColorStop(0, c.light);
      trailGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(flip * (w / 2 - 4), -4);
      ctx.lineTo(flip * (w / 2 + 14), 0);
      ctx.lineTo(flip * (w / 2 - 4), 4);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Ship body (saucer-like alien)
      ctx.fillStyle = flash ? '#fff' : c.body;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.quadraticCurveTo(-w / 2 + 4, -h / 2, 0, -h / 2);
      ctx.quadraticCurveTo(w / 2 - 4, -h / 2, w / 2, 0);
      ctx.quadraticCurveTo(w / 2 - 4, h / 2, 0, h / 2);
      ctx.quadraticCurveTo(-w / 2 + 4, h / 2, -w / 2, 0);
      ctx.closePath();
      ctx.fill();

      // Top highlight
      ctx.fillStyle = flash ? '#fff' : c.light;
      ctx.beginPath();
      ctx.ellipse(0, -h / 4, w / 3, h / 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dome (glass cockpit)
      var dgrad = ctx.createRadialGradient(-3, -h / 3, 1, 0, -h / 3, 10);
      dgrad.addColorStop(0, '#fff');
      dgrad.addColorStop(0.6, c.light);
      dgrad.addColorStop(1, c.dark);
      ctx.fillStyle = flash ? '#fff' : dgrad;
      ctx.beginPath();
      ctx.arc(0, -h / 3, 8, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Eyes (alien - big black)
      var eyeY = -h / 3 + 2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(-5, eyeY, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(5, eyeY, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eye shine
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-5.5, eyeY - 1, 0.8, 0, Math.PI * 2);
      ctx.arc(4.5, eyeY - 1, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Bottom lights (animated)
      for (var li = -1; li <= 1; li++) {
        ctx.fillStyle = frame % 24 < 12 ? c.light : '#fbbf24';
        ctx.beginPath();
        ctx.arc(li * (w / 4), h / 3 + 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  // ─────────────────────────────────────
  //  DRAW ROCKET (missile with trail)
  // ─────────────────────────────────────
  function drawRocket(r) {
    ctx.save();

    // Trail (smoke)
    for (var t = 0; t < r.trail.length; t++) {
      var tp = r.trail[t];
      var alpha = t / r.trail.length;
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = t % 2 === 0 ? '#94a3b8' : '#64748b';
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 2 + alpha * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Rocket body
    var angle = Math.atan2(r.vy, r.vx) + Math.PI / 2;
    ctx.translate(r.x, r.y);
    ctx.rotate(angle);

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ef4444';

    // Flame
    var flame = 8 + Math.sin(frame * 0.8) * 4;
    var fg = ctx.createLinearGradient(0, 8, 0, 8 + flame);
    fg.addColorStop(0, '#fbbf24');
    fg.addColorStop(0.5, '#ef4444');
    fg.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-3, 8);
    ctx.lineTo(0, 8 + flame);
    ctx.lineTo(3, 8);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-4, 8);
    ctx.lineTo(4, 8);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();

    // Red tip
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-4, -4);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();

    // White stripe
    ctx.fillStyle = '#fff';
    ctx.fillRect(-4, 2, 8, 2);

    // Fins
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-4, 6);
    ctx.lineTo(-7, 10);
    ctx.lineTo(-4, 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 6);
    ctx.lineTo(7, 10);
    ctx.lineTo(4, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ─────────────────────────────────────
  //  MAIN UPDATE LOOP
  // ─────────────────────────────────────
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
        // Refill some rockets each wave
        rocketAmmo = Math.min(9, rocketAmmo + 2);
        updateHUD();
        if (wave % 5 === 0) spawnBoss();
      }

      // Rocket reload
      if (rocketAmmo < 5) {
        rocketReload++;
        if (rocketReload > 180) {
          rocketAmmo++;
          rocketReload = 0;
          updateHUD();
        }
      }
    }

    // Player movement
    if (!gameOver && player.alive) {
      if (moveL) player.tx -= 5;
      if (moveR) player.tx += 5;
      if (player.tx < 20) player.tx = 20;
      if (player.tx > W - 20) player.tx = W - 20;
      player.x += (player.tx - player.x) * 0.28;
      player.y += (player.ty - player.y) * 0.28;

      if (autoFire) shoot();
      player.cool = Math.max(0, player.cool - 1);
      if (player.invuln > 0) player.invuln--;
    }

    // Spawn enemies
    if (!gameOver && player.alive) {
      spawnTimer++;
      var spawnRate = Math.max(28, 70 - wave * 4);
      if (spawnTimer > spawnRate && enemies.length < 14) {
        spawnEnemy();
        spawnTimer = 0;
        if (wave > 3 && Math.random() < 0.35) spawnEnemy();
      }
    }

    // Bullets
    for (var b = bullets.length - 1; b >= 0; b--) {
      var bl = bullets[b];
      bl.x += bl.vx;
      bl.y += bl.vy;
      if (bl.y < -10 || bl.x < -10 || bl.x > W + 10) { bullets.splice(b, 1); continue; }

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

      for (var ei = enemies.length - 1; ei >= 0; ei--) {
        var e = enemies[ei];
        if (Math.abs(bl.x - e.x) < e.w / 2 && Math.abs(bl.y - e.y) < e.h / 2 + 4) {
          bullets.splice(b, 1);
          if (damageEnemy(e, 1)) enemies.splice(ei, 1);
          break;
        }
      }
    }

    // Rockets
    for (var ri = rockets.length - 1; ri >= 0; ri--) {
      var r = rockets[ri];

      // Homing toward target
      if (r.target && enemies.indexOf(r.target) !== -1 && r.target.hp > 0) {
        var dx = r.target.x - r.x;
        var dy = r.target.y - r.y;
        var d = Math.hypot(dx, dy) || 1;
        var speed = 6;
        r.vx = (dx / d) * speed;
        r.vy = (dy / d) * speed;
      } else {
        r.vy -= 0.5;
        if (r.vy < -8) r.vy = -8;
        r.vx *= 0.98;
      }

      r.x += r.vx;
      r.y += r.vy;

      // Trail
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 10) r.trail.shift();

      // Smoke particles
      r.smokeTimer++;
      if (r.smokeTimer > 2) {
        particles.push({
          x: r.x, y: r.y,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1 + 1,
          life: 0.6, size: 2 + Math.random() * 2,
          color: '#64748b'
        });
        r.smokeTimer = 0;
      }

      drawRocket(r);

      // Out of bounds
      if (r.x < -30 || r.x > W + 30 || r.y < -30 || r.y > H + 30) {
        rockets.splice(ri, 1);
        continue;
      }

      // Explosion on hit
      var hit = false;
      for (var ei2 = enemies.length - 1; ei2 >= 0; ei2--) {
        var en = enemies[ei2];
        if (Math.abs(r.x - en.x) < en.w / 2 + 6 && Math.abs(r.y - en.y) < en.h / 2 + 6) {
          // Big explosion
          explode(en.x, en.y, '#fbbf24', 40);
          explode(en.x, en.y, '#ef4444', 25);
          shake = 12;
          // Deal 5 damage (very strong)
          if (damageEnemy(en, 5)) {
            // Damage nearby enemies too
            for (var k = 0; k < enemies.length; k++) {
              var nearE = enemies[k];
              if (nearE === en) continue;
              var dist2 = Math.hypot(nearE.x - en.x, nearE.y - en.y);
              if (dist2 < 60) {
                if (damageEnemy(nearE, 3)) {
                  enemies.splice(k, 1);
                  k--;
                }
              }
            }
            enemies.splice(ei2, 1);
          }
          rockets.splice(ri, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;
    }

    // Enemies (flying)
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      e.t++;
      if (e.hitFlash > 0) e.hitFlash--;

      if (!gameOver && player.alive) {
        if (e.type === 'boss') {
          if (e.y < 80) e.y += 1;
          else {
            e.x += e.vx;
            if (e.x < 80 || e.x > W - 80) e.vx *= -1;
          }
        } else if (e.flightType === 'zigzag') {
          e.x += e.vx;
          e.y += e.vy;
          // S-curve vertical
          e.y = e.baseY + Math.sin(e.t * 0.06 + e.phase) * 40;
          // Bounce off walls
          if (e.x < 40) { e.x = 40; e.vx = Math.abs(e.vx); }
          if (e.x > W - 40) { e.x = W - 40; e.vx = -Math.abs(e.vx); }
        } else if (e.flightType === 'fromLeft' || e.flightType === 'fromRight') {
          e.x += e.vx;
          e.y += e.vy;
          // Curve downward
          e.vy += 0.015;
          // Bounce off opposite wall
          if (e.x < 20) { e.x = 20; e.vx = Math.abs(e.vx); }
          if (e.x > W - 20) { e.x = W - 20; e.vx = -Math.abs(e.vx); }
        } else {
          // straight
          e.x += e.vx;
          e.y += e.vy;
        }
      }

      drawEnemy(e);

      // Shoot
      if (e.y > 20 && e.y < H - 60 && e.x > 10 && e.x < W - 10) {
        e.shootCool--;
        if (e.shootCool <= 0) {
          enemyShoot(e);
          e.shootCool = e.type === 'boss' ? 20 : Math.floor(90 + Math.random() * 60 - wave * 2);
        }
      }

      // Player collision
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

      // Remove if off-screen (for non-boss)
      if (e.type !== 'boss') {
        if (e.y > H + 80 || (e.flightType === 'fromLeft' && e.x > W + 60) ||
            (e.flightType === 'fromRight' && e.x < -60)) {
          enemies.splice(i, 1);
        }
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
      ctx.fillText('Wave: ' + wave + '  ·  Kills: ' + kills, W / 2, H / 2 + 34);
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

  // ─────────────────────────────────────
  //  CONTROLS
  // ─────────────────────────────────────
  var dragging = false;
  function handleDown(e) {
    e.preventDefault();
    if (gameOver) { reset(); return; }
    dragging = true;
    var rect = cvs.getBoundingClientRect();
    var cx, cy;
    if (e.touches && e.touches.length) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
    else { cx = e.clientX; cy = e.clientY; }
    player.tx = (cx - rect.left) * (W / rect.width);
    player.ty = Math.max(H * 0.15, (cy - rect.top) * (H / rect.height));
  }
  function handleMove(e) {
    if (!dragging || gameOver) return;
    e.preventDefault();
    var rect = cvs.getBoundingClientRect();
    var cx, cy;
    if (e.touches && e.touches.length) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
    else { cx = e.clientX; cy = e.clientY; }
    player.tx = Math.max(20, Math.min(W - 20, (cx - rect.left) * (W / rect.width)));
    player.ty = Math.max(H * 0.15, Math.min(H - 30, (cy - rect.top) * (H / rect.height)));
  }
  function handleUp() { dragging = false; }

  cvs.addEventListener('pointerdown', handleDown);
  cvs.addEventListener('pointermove', handleMove);
  cvs.addEventListener('pointerup', handleUp);
  cvs.addEventListener('pointerleave', handleUp);
  cvs.addEventListener('touchstart', handleDown, { passive: false });
  cvs.addEventListener('touchmove', handleMove, { passive: false });
  cvs.addEventListener('touchend', handleUp);

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

  // Rocket button
  var fireBtn = document.getElementById('fireBtn');
  fireBtn.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    launchRocket();
  });
  fireBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    launchRocket();
  }, { passive: false });

  // Keyboard
  window.addEventListener('keydown', function(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); moveL = true; }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); moveR = true; }
    if (e.code === 'Space') { e.preventDefault(); launchRocket(); }
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
                botResponseId: "b2e40280-433c-45d8-9c1a-270bec558860",
                verificationMetadata: {
                    proofs: [
                        {
                            version: 1,
                            useCase: 1,
                            signature: "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LVZlcmlmaWNhdGlvblNpZ25hdHVyZS5NZXRhZGF0YeN55YRyad2+ZA==",
                            certificateChain: [
                                "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGEOvtJr968bbpKdZreOTwkk9aPN++XPE60RfuzNLkXXc7LE8BOkJOWRpo2oNXaRJ3uCNJ43HY3A+oetnvHSfcxWqmvvTSrBOI5V1NOD6RMsZ/st1XVPUx83AGps1l5jYBOYzqMNy6un2tToJ2Bt9bXRo29tWLZTu8m7TNY/hISwVpVc5tjSet5U7btPN+dMIx2UvykB1jcbWGsdklheeuz8RXSStNXzeaGvsf1lpZ/ugLE4b2BdmlRNKrY6zLE4qFtRYQoS7axOyQX+4QUyN2m9bfm7urQmn+QRSXJwMO7X5kAJJLbkVGJFt9Pm9VXPwQVrK2aaqiXlpusj+7DfDw00OULmYMmZDTqXM0nUVLxj13z0LhMQoQhhNG8utdUn4uKOFceliTZ/xiP+A54GnX9620641bqw3ctfh9NNXPsTEK8hAUD7FDqUhVntHmoEYYEHq8X1tHHZYP49/f2iezTiE8AUaoZo42/jIWQIKohOGNUib2hEqMkW8NsR8vPihvNuqPc0zKZcl6359YFQdjiiW8kCRD/rsDOr9v1eYLFZKYloFyzFqEgj+jcG/V47elOjShJ5CCPwatXwP6HIloVwtgygFsnOFmCg6Ojoivfoz8Nw1qxFwg5OU2cq/1WbWNELKnaFg4eUWCAIJ/3ZIJsEPkgemZxGhE+hdiNn9dkQYBJs1kx2BxdIkJmQ9vJSKkrMz6lTxZM3IJ9mhmKS6zYdU1ppeAao0/ayte997DQParb/AHLN79g0iW1ad0z8ir5jAl0q3a+UZPTSa4YiSqC2PZ/gfxG5wvL2mKmeKowG0RXjmEp5iNxrni+T/HRLZOoH7y0DQ24nMCPg",
                                "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGHsL0Ccm0ELINFZ2IaBhKaeWnVuh0o6nZLCioCn9xpSADzwIS5VCWO+1eVXT2atJOyf7FYlpB0/JA3Us+aQtekuIkHu/zBXijORZ4ClF4+sF3cSTNg6gY/+6iwLK/zs3bMg+GeJrcI65vXfs95Shxlb2Rd5GRT2/2yBmR6Zkf5QwMJuptUHWtM26WY7/xlkEKGFYDZVqOSylusiOzSALa815zC6dCiHoJNLBEKMlaZZQOk57/+OYoU5zzTaEgLhyvNFHSyAlyLQ3SGFtVHAaJZHSmmSPyJowCOB+92Gkk6SWVMsk6FbU8QJWFtlhzV/W/gZ7WzUlS/AKgN0th9/cq20ToFkW7X9c+rtYavufmuieqFhXgaMD8AGsoN9QC/HzNC9D1nydPfFYEUr9BHVy2nF5gM58Y59r2rT8p5LPARIkUp8g+5DLhyW0tdZFZ1305o4AHCayZnp5rjcU2Xi/c1Qf/djBGakmijlMs4aMzKJYD0c4Q8jdI7sNyd876K2wRD+L6KeD2QB3PtCS4P7BWAl5gh5CJ6ZBrwcaKXZqcSjEwm52MqVCgYZdapAaNYUy/QndttjLOG0wxxwuX1hIhMjPnIKZR1kwnqD5EqlHpilrnojRZvjVGN4zEKmilS8rNstt4HHs/D849W+Q6LRVWiWMs0cT2IugrX+Skxd8En7Gq52UEmuVBrSTpN+UpIu20NsVb9lsvuYh3XO441606tOEY2eKcZJdTtqrOTNqbbTk0zVn1yhbOCvmfctBNDhTwaC5QMi0P9wjU5XI9SBtkdQLizc5oqpoiHeqgb8+aJHVLcbgIJ/KLZKtRWFDfzRNM02Csx4etUUapVd2NA/L0oMs/O5T9sVj9FBJ7q99GWr3PVmxJb36mHZLXC4k1gGN9swE0LtzYsUdT5tUo9ri/hS3W/WM+F1p4Kh4QIgRcG3ciIHGN44bnDh3HDCz0fDnzKYw0bclMxZPctEyJ5gEOPF6OAkjD9dEaRGq/tEPf1k9Aub+v2dEjnfrYWAm4E5Zfhs2Xh0CT0k+SzhgKd0K/46ChJ20G5+blwpIvahvTVS68+aVIX6CwXs4tcVx6FnmVsMOOkIasfaqQLZYbNBkuLoZnQAq4j8yRekrQ=="
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
