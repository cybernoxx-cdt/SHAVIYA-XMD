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
    pattern:  'dino',
    alias:    ['dinosaur', 'dinogame', 'trex'],
    desc:     'Play Chrome Dino Game inside WhatsApp',
    category: 'game',
    react:    '🦖',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '🦖', key: mek.key }
        });

        // ⚠️ DO NOT CHANGE A SINGLE CHARACTER IN THIS HTML.
        // Any modification will break the verification signature and cause "Update WhatsApp" error.
        const gameHtml = `<style>
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; touch-action: none; overflow: hidden; }
.wrapper { width: 100%; max-width: 480px; margin: auto; padding: 12px; }
.card { background: linear-gradient(180deg, rgba(15,18,26,0.97), rgba(10,12,18,0.97)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 2px solid #10b981; border-radius: 20px; overflow: hidden; box-shadow: 0 14px 44px rgba(0,0,0,0.75), inset 0 0 40px rgba(16,185,129,0.06); padding: 14px; position: relative; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.title { font-size: 10px; letter-spacing: 1.5px; color: #10b981; font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px; }
.title .dot{ width:6px; height:6px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981; animation: pulse 1.4s infinite; }
@keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.3} }
.score-badge { font-size: 20px; font-weight: 900; color: #10b981; text-shadow: 0 0 12px rgba(16,185,129,0.5); font-variant-numeric: tabular-nums; }
.best-badge { font-size: 10px; color: #94a3b8; font-variant-numeric: tabular-nums; }
.stat-row { display:flex; gap:8px; margin-bottom:8px; }
.stat-pill { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:5px 8px; text-align:center; }
.stat-pill .lbl{ font-size:8px; letter-spacing:1px; color:#64748b; text-transform:uppercase; font-weight:700; }
.stat-pill .val{ font-size:13px; font-weight:900; color:#fff; font-variant-numeric: tabular-nums; }
#game-container { position: relative; width: 100%; height: 300px; border-radius: 14px; overflow: hidden; border: 2px solid #1e293b; box-shadow: inset 0 0 30px rgba(0,0,0,0.6); }
canvas { width: 100%; height: 100%; display: block; background: #0f172a; }
.controls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
.btn { padding: 14px; font-size: 15px; font-weight: 800; border: none; border-radius: 12px; cursor: pointer; color: #fff; text-align: center; letter-spacing: 0.5px; position: relative; overflow: hidden; }
.btn-jump { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px rgba(16,185,129,0.45), inset 0 1px 0 rgba(255,255,255,0.2); }
.btn-duck { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 16px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.2); }
.btn:active { transform: scale(0.95); filter: brightness(0.9); }
.hint { margin-top: 8px; text-align: center; font-size: 9px; color: #64748b; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; }
.credit-bar { margin-top: 10px; text-align: center; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #94a3b8; text-transform: uppercase; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 8px; }
.credit-bar span { color: #10b981; text-shadow: 0 0 10px rgba(16,185,129,0.5); }
</style>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div>
        <div class="title"><span class="dot"></span>SHAVIYA XMD</div>
        <h2 style="font-size: 17px; font-weight: 900; color: #fff; margin-top:2px;">Dino Runner 🦖</h2>
      </div>
      <div style="text-align: right;">
        <div class="score-badge" id="score">00000</div>
        <div class="best-badge" id="best">BEST 00000</div>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-pill"><div class="lbl">Speed</div><div class="val" id="speedStat">1.0x</div></div>
      <div class="stat-pill"><div class="lbl">Coins</div><div class="val" id="coinStat">0</div></div>
      <div class="stat-pill"><div class="lbl">Time</div><div class="val" id="timeStat">0s</div></div>
    </div>

    <div id="game-container">
      <canvas id="c"></canvas>
    </div>

    <div class="controls">
      <button class="btn btn-jump" id="jumpBtn">⬆️ JUMP</button>
      <button class="btn btn-duck" id="duckBtn">⬇️ DUCK</button>
    </div>

    <div class="hint">Tap LEFT side to Jump · RIGHT side to Duck</div>

    <div class="credit-bar">
      Engineered by <span>SAVENDRA DAMPRiya</span> ⚡
    </div>
  </div>
</div>

<script>
(function() {
  var cvs = document.getElementById('c');
  var ctx = cvs.getContext('2d');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var speedStatEl = document.getElementById('speedStat');
  var coinStatEl = document.getElementById('coinStat');
  var timeStatEl = document.getElementById('timeStat');

  var W = 360;
  var H = 300;
  cvs.width = W;
  cvs.height = H;

  var GROUND_Y = H - 40;
  var GRAVITY = 0.65;
  var JUMP_V = -12.5;

  var gameOver = false;
  var started = false;
  var score = 0;
  var best = 0;
  var coins = 0;
  var timeAlive = 0;
  var baseSpeed = 5;
  var speed = baseSpeed;
  var frame = 0;
  var shake = 0;
  var flashAlpha = 0;
  var nightMode = false;
  var nightTimer = 0;

  try { best = parseInt(localStorage.getItem('dino_best_v1') || '0', 10) || 0; } catch(e){}
  bestEl.textContent = 'BEST ' + String(best).padStart(5, '0');

  var dino = {
    x: 50,
    y: GROUND_Y - 44,
    w: 44,
    h: 44,
    vy: 0,
    onGround: true,
    ducking: false,
    legFrame: 0,
    blink: 0
  };

  var obstacles = [];
  var coinItems = [];
  var particles = [];
  var groundDots = [];
  var clouds = [];
  var stars = [];

  for (var i = 0; i < 40; i++) {
    groundDots.push({ x: Math.random() * W, y: GROUND_Y + 4 + Math.random() * 22, size: 1 + Math.random() * 2 });
  }
  for (var i = 0; i < 4; i++) {
    clouds.push({ x: Math.random() * W, y: 30 + Math.random() * 60, w: 30 + Math.random() * 40, spd: 0.15 + Math.random() * 0.25 });
  }
  for (var i = 0; i < 50; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * (GROUND_Y - 40), size: Math.random() < 0.7 ? 1 : 1.6, tw: Math.random() * Math.PI * 2 });
  }

  var spawnCounter = 0;
  var coinCounter = 0;

  function reset() {
    gameOver = false;
    started = true;
    score = 0;
    coins = 0;
    timeAlive = 0;
    speed = baseSpeed;
    obstacles = [];
    coinItems = [];
    particles = [];
    frame = 0;
    shake = 0;
    flashAlpha = 0;
    nightMode = false;
    nightTimer = 0;
    dino.y = GROUND_Y - 44;
    dino.vy = 0;
    dino.onGround = true;
    dino.ducking = false;
    scoreEl.textContent = '00000';
    coinStatEl.textContent = '0';
    timeStatEl.textContent = '0s';
    speedStatEl.textContent = '1.0x';
  }

  function jump() {
    if (gameOver) { reset(); return; }
    if (!started) started = true;
    if (dino.onGround) {
      dino.vy = JUMP_V;
      dino.onGround = false;
      dino.ducking = false;
      for (var i = 0; i < 8; i++) {
        particles.push({
          x: dino.x + 20, y: GROUND_Y - 2,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 2,
          life: 1, size: 2 + Math.random() * 2,
          color: '#94a3b8'
        });
      }
    }
  }

  function duckStart() {
    if (gameOver) return;
    if (!started) started = true;
    if (!dino.onGround) {
      dino.vy += 4;
    }
    dino.ducking = true;
  }

  function duckEnd() {
    dino.ducking = false;
  }

  function spawnObstacle() {
    var r = Math.random();
    var type, w, h;
    if (r < 0.55) {
      // Small cactus
      w = 18; h = 34;
      type = 'cactus_small';
    } else if (r < 0.8) {
      // Large cactus
      w = 26; h = 48;
      type = 'cactus_large';
    } else {
      // Pterodactyl (bird) — only after score 400
      if (score < 400) { w = 22; h = 40; type = 'cactus_large'; }
      else { w = 36; h = 26; type = 'bird'; }
    }
    var y;
    if (type === 'bird') {
      var heights = [GROUND_Y - 90, GROUND_Y - 60, GROUND_Y - 30];
      y = heights[Math.floor(Math.random() * heights.length)];
    } else {
      y = GROUND_Y - h;
    }
    obstacles.push({
      type: type,
      x: W + 10,
      y: y,
      w: w, h: h,
      flap: 0,
      scored: false
    });
  }

  function spawnCoin() {
    var y = GROUND_Y - 60 - Math.random() * 60;
    coinItems.push({ x: W + 10, y: y, r: 9, spin: 0 });
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

  function drawDino() {
    var x = dino.x;
    var y = dino.y;
    var w = dino.ducking ? 52 : dino.w;
    var h = dino.ducking ? 30 : dino.h;

    if (dino.ducking) {
      y = GROUND_Y - 30;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, GROUND_Y + 2, w * 0.4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = nightMode ? '#e2e8f0' : '#cbd5e1';

    if (dino.ducking) {
      // Ducking pose (horizontal)
      roundRect(x, y, 40, 24, 6); ctx.fill();
      // Head
      roundRect(x + 34, y - 4, 18, 16, 4); ctx.fill();
      // Eye
      ctx.fillStyle = nightMode ? '#0f172a' : '#0f172a';
      ctx.beginPath();
      ctx.arc(x + 46, y + 3, 2, 0, Math.PI * 2);
      ctx.fill();
      // Legs (animated)
      ctx.fillStyle = nightMode ? '#e2e8f0' : '#cbd5e1';
      var legOff = (frame % 10 < 5) ? 0 : 4;
      ctx.fillRect(x + 6, y + 22, 4, 8 - legOff);
      ctx.fillRect(x + 20, y + 22, 4, 4 + legOff);
      // Tail
      ctx.fillRect(x - 6, y + 6, 8, 5);
    } else {
      // Standing pose
      // Tail
      ctx.fillRect(x - 6, y + 22, 10, 6);
      // Legs (animated)
      var legOff2 = (frame % 12 < 6) ? 0 : 3;
      ctx.fillRect(x + 10, y + 32, 5, 12 - legOff2);
      ctx.fillRect(x + 24, y + 32, 5, 9 + legOff2);
      // Body
      roundRect(x + 4, y + 12, 30, 24, 6); ctx.fill();
      // Head
      roundRect(x + 22, y + 2, 22, 20, 5); ctx.fill();
      // Snout
      ctx.fillRect(x + 40, y + 14, 6, 6);
      // Eye
      ctx.fillStyle = '#0f172a';
      if (dino.blink > 0) {
        ctx.fillRect(x + 34, y + 8, 5, 2);
      } else {
        ctx.beginPath();
        ctx.arc(x + 36, y + 9, 2.2, 0, Math.PI * 2);
        ctx.fill();
        // Eye white
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 36.5, y + 8.5, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Arm
      ctx.fillStyle = nightMode ? '#e2e8f0' : '#cbd5e1';
      ctx.fillRect(x + 28, y + 22, 10, 4);
    }
  }

  function drawObstacle(o) {
    ctx.fillStyle = nightMode ? '#4ade80' : '#22c55e';

    if (o.type === 'cactus_small' || o.type === 'cactus_large') {
      var cx = o.x + o.w / 2;
      var cy = o.y + o.h;
      // Main trunk
      ctx.fillStyle = nightMode ? '#4ade80' : '#16a34a';
      roundRect(o.x + o.w * 0.35, o.y, o.w * 0.3, o.h, 3); ctx.fill();
      // Arms
      ctx.fillRect(o.x + o.w * 0.05, o.y + o.h * 0.3, o.w * 0.3, o.h * 0.15);
      ctx.fillRect(o.x + o.w * 0.05, o.y + o.h * 0.3, o.w * 0.12, o.h * 0.4);
      ctx.fillRect(o.x + o.w * 0.65, o.y + o.h * 0.4, o.w * 0.3, o.h * 0.15);
      ctx.fillRect(o.x + o.w * 0.83, o.y + o.h * 0.25, o.w * 0.12, o.h * 0.4);
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(o.x + o.w * 0.4, o.y + 3, 2, o.h - 6);
    } else if (o.type === 'bird') {
      // Pterodactyl
      var bx = o.x + o.w / 2;
      var by = o.y + o.h / 2;
      var flapPhase = (o.flap % 20) < 10;
      ctx.fillStyle = nightMode ? '#a5b4fc' : '#818cf8';
      // Body
      roundRect(o.x + 8, o.y + 8, 20, 10, 4); ctx.fill();
      // Head
      roundRect(o.x + 24, o.y + 4, 12, 8, 3); ctx.fill();
      // Beak
      ctx.fillStyle = nightMode ? '#fbbf24' : '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(o.x + 34, o.y + 8);
      ctx.lineTo(o.x + 40, o.y + 10);
      ctx.lineTo(o.x + 34, o.y + 12);
      ctx.closePath();
      ctx.fill();
      // Wing
      ctx.fillStyle = nightMode ? '#a5b4fc' : '#6366f1';
      if (flapPhase) {
        ctx.beginPath();
        ctx.moveTo(o.x + 6, o.y + 10);
        ctx.lineTo(o.x + 18, o.y - 4);
        ctx.lineTo(o.x + 28, o.y + 10);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(o.x + 6, o.y + 12);
        ctx.lineTo(o.x + 18, o.y + 22);
        ctx.lineTo(o.x + 28, o.y + 12);
        ctx.closePath();
        ctx.fill();
      }
      // Eye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(o.x + 30, o.y + 8, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGround() {
    // Sky
    if (nightMode) {
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, W, H);
      // Stars
      for (var s = 0; s < stars.length; s++) {
        var st = stars[s];
        st.tw += 0.05;
        var alpha = 0.4 + Math.sin(st.tw) * 0.4;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Moon
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(W - 60, 50, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0f1e';
      ctx.beginPath();
      ctx.arc(W - 52, 46, 18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Day
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // Sun
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(W - 60, 50, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(251,191,36,0.2)';
      ctx.beginPath();
      ctx.arc(W - 60, 50, 32, 0, Math.PI * 2);
      ctx.fill();
    }

    // Clouds
    for (var ci = 0; ci < clouds.length; ci++) {
      var cl = clouds[ci];
      if (!gameOver && started) cl.x -= cl.spd;
      if (cl.x + cl.w < -10) { cl.x = W + 20; cl.y = 20 + Math.random() * 70; }
      ctx.fillStyle = nightMode ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)';
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, cl.w * 0.5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cl.x + 12, cl.y - 4, cl.w * 0.3, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground line
    ctx.fillStyle = nightMode ? '#475569' : '#64748b';
    ctx.fillRect(0, GROUND_Y, W, 2);

    // Ground dots (moving)
    if (!gameOver && started) {
      for (var gi = 0; gi < groundDots.length; gi++) {
        var g = groundDots[gi];
        g.x -= speed;
        if (g.x < -5) { g.x = W + 5; g.y = GROUND_Y + 4 + Math.random() * 22; }
      }
    }
    ctx.fillStyle = nightMode ? '#334155' : '#475569';
    for (var gi2 = 0; gi2 < groundDots.length; gi2++) {
      var g2 = groundDots[gi2];
      ctx.fillRect(g2.x, g2.y, g2.size * 3, g2.size);
    }
  }

  function explode(x, y, color) {
    for (var i = 0; i < 25; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 2 + Math.random() * 5;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        color: color, life: 1,
        size: 2 + Math.random() * 3
      });
    }
    shake = 10;
    flashAlpha = 0.4;
  }

  function update() {
    frame++;
    ctx.save();
    if (shake > 0) {
      var sx = (Math.random() - 0.5) * shake;
      var sy = (Math.random() - 0.5) * shake;
      ctx.translate(sx, sy);
      shake *= 0.88;
      if (shake < 0.5) shake = 0;
    }

    ctx.clearRect(-10, -10, W + 20, H + 20);
    drawGround();

    // Night cycle
    if (started && !gameOver) {
      nightTimer++;
      if (nightTimer > 800 && !nightMode) { nightMode = true; nightTimer = 0; }
      else if (nightTimer > 500 && nightMode) { nightMode = false; nightTimer = 0; }
    }

    if (started && !gameOver) {
      speed = baseSpeed + Math.min(score / 500, 6);
      speedStatEl.textContent = (speed / baseSpeed).toFixed(1) + 'x';
      score += 1;
      scoreEl.textContent = String(score).padStart(5, '0');
      timeAlive = Math.floor(frame / 60);
      timeStatEl.textContent = timeAlive + 's';

      if (score > best) {
        best = score;
        try { localStorage.setItem('dino_best_v1', String(best)); } catch(e){}
        bestEl.textContent = 'BEST ' + String(best).padStart(5, '0');
      }

      // Blink
      dino.blink--;
      if (dino.blink < -180 && Math.random() < 0.02) dino.blink = 8;

      // Physics
      if (!dino.onGround) {
        dino.vy += GRAVITY;
        dino.y += dino.vy;
        if (dino.y >= GROUND_Y - 44) {
          dino.y = GROUND_Y - 44;
          dino.vy = 0;
          dino.onGround = true;
          // Landing particles
          for (var lp = 0; lp < 5; lp++) {
            particles.push({
              x: dino.x + 20 + (Math.random() - 0.5) * 20,
              y: GROUND_Y - 2,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 2,
              life: 1, size: 1 + Math.random() * 2,
              color: '#94a3b8'
            });
          }
        }
      }

      // Spawn obstacles
      spawnCounter++;
      var gap = Math.max(50, 90 - Math.floor(score / 80));
      if (spawnCounter > gap) {
        if (Math.random() < 0.85) spawnObstacle();
        spawnCounter = 0;
      }

      // Spawn coins
      coinCounter++;
      if (coinCounter > 120) { spawnCoin(); coinCounter = 0; }
    }

    // Draw coins
    for (var coi = coinItems.length - 1; coi >= 0; coi--) {
      var co = coinItems[coi];
      if (!gameOver && started) { co.x -= speed; co.spin += 0.15; }
      var squash = Math.abs(Math.cos(co.spin));
      ctx.save();
      ctx.translate(co.x, co.y);
      ctx.scale(Math.max(0.2, squash), 1);
      // Outer
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, co.r, 0, Math.PI * 2);
      ctx.fill();
      // Inner
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(0, 0, co.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Collision with dino
      var dW = dino.ducking ? 52 : dino.w;
      var dH = dino.ducking ? 30 : dino.h;
      var dY = dino.ducking ? GROUND_Y - 30 : dino.y;
      if (Math.abs(co.x - (dino.x + dW / 2)) < dW / 2 + co.r &&
          Math.abs(co.y - (dY + dH / 2)) < dH / 2 + co.r) {
        coins++;
        coinStatEl.textContent = coins;
        score += 50;
        explode(co.x, co.y, '#fbbf24');
        coinItems.splice(coi, 1);
        continue;
      }

      if (co.x < -20) coinItems.splice(coi, 1);
    }

    // Draw obstacles
    for (var oi = obstacles.length - 1; oi >= 0; oi--) {
      var o = obstacles[oi];
      if (!gameOver && started) {
        o.x -= speed;
        o.flap++;
      }
      drawObstacle(o);

      // Collision
      var ddW = dino.ducking ? 52 : dino.w;
      var ddH = dino.ducking ? 30 : dino.h;
      var ddY = dino.ducking ? GROUND_Y - 30 : dino.y;
      var dinoBox = {
        x: dino.x + 6, y: ddY + 4,
        w: ddW - 10, h: ddH - 8
      };
      var obsBox = {
        x: o.x + 4, y: o.y + 4,
        w: o.w - 8, h: o.h - 8
      };
      if (dinoBox.x < obsBox.x + obsBox.w &&
          dinoBox.x + dinoBox.w > obsBox.x &&
          dinoBox.y < obsBox.y + obsBox.h &&
          dinoBox.y + dinoBox.h > obsBox.y) {
        if (!gameOver) {
          gameOver = true;
          explode(dino.x + 20, dino.y + 20, '#ef4444');
          explode(o.x + o.w / 2, o.y + o.h / 2, '#f59e0b');
        }
      }

      if (o.x < -60) obstacles.splice(oi, 1);
    }

    // Draw dino
    if (started && !gameOver) drawDino();

    // Particles
    for (var pi = particles.length - 1; pi >= 0; pi--) {
      var pt = particles[pi];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.2;
      pt.life -= 0.035;
      if (pt.life <= 0) { particles.splice(pi, 1); continue; }
      ctx.globalAlpha = Math.max(pt.life, 0);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Flash
    if (flashAlpha > 0.01) {
      ctx.fillStyle = 'rgba(255,255,255,' + flashAlpha + ')';
      ctx.fillRect(-10, -10, W + 20, H + 20);
      flashAlpha *= 0.85;
    }

    // Start screen
    if (!started) {
      ctx.fillStyle = 'rgba(10,12,20,0.7)';
      ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#10b981';
      ctx.font = '900 26px sans-serif';
      ctx.fillText('🦖 DINO RUNNER', W / 2, H / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '800 13px sans-serif';
      ctx.fillText('TAP TO START', W / 2, H / 2 + 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 10px sans-serif';
      ctx.fillText('Jump over cacti · Duck under birds', W / 2, H / 2 + 32);
    }

    // Game over screen
    if (gameOver) {
      ctx.fillStyle = 'rgba(10, 12, 20, 0.85)';
      ctx.fillRect(-10, -10, W + 20, H + 20);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 15px sans-serif';
      ctx.fillText('Score: ' + score, W / 2, H / 2 - 5);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 12px sans-serif';
      ctx.fillText('🪙 Coins: ' + coins, W / 2, H / 2 + 18);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 11px sans-serif';
      ctx.fillText('Best: ' + best + '  •  Time: ' + timeAlive + 's', W / 2, H / 2 + 38);

      ctx.fillStyle = '#10b981';
      ctx.font = '800 13px sans-serif';
      ctx.fillText('TAP TO RESTART', W / 2, H / 2 + 68);
    }

    ctx.restore();
    requestAnimationFrame(update);
  }

  function addTap(id, fn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', function(e) { e.preventDefault(); fn(); });
    el.addEventListener('touchstart', function(e) { e.preventDefault(); fn(); });
  }

  addTap('jumpBtn', jump);
  addTap('duckBtn', duckStart);
  document.getElementById('duckBtn').addEventListener('pointerup', duckEnd);
  document.getElementById('duckBtn').addEventListener('touchend', duckEnd);
  document.getElementById('duckBtn').addEventListener('pointerleave', duckEnd);

  function canvasTap(e) {
    e.preventDefault();
    if (gameOver) { reset(); return; }
    if (!started) { started = true; return; }
    var rect = cvs.getBoundingClientRect();
    var clientX = e.clientX;
    if (e.touches && e.touches.length > 0) clientX = e.touches[0].clientX;
    var clickX = (clientX - rect.left) * (W / rect.width);
    if (clickX < W / 2) jump(); else duckStart();
  }

  function canvasEnd(e) {
    e.preventDefault();
    duckEnd();
  }

  cvs.addEventListener('pointerdown', canvasTap);
  cvs.addEventListener('pointerup', canvasEnd);
  cvs.addEventListener('touchstart', canvasTap);
  cvs.addEventListener('touchend', canvasEnd);

  // Keyboard (works if opened in real browser)
  window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    if (e.code === 'ArrowDown') { e.preventDefault(); duckStart(); }
  });
  window.addEventListener('keyup', function(e) {
    if (e.code === 'ArrowDown') duckEnd();
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
                        submessages: [{ messageType: 2, messageText: "Dino Runner 🦖" }],
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
        console.error('Dino Send Error:', err);
        return reply('❌ Dino game load error');
    }
});
