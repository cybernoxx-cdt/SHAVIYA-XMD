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
    pattern:  'flappy',
    alias:    ['flappybird', 'bird', 'fly'],
    desc:     'Play Flappy Bird — Premium Edition',
    category: 'game',
    react:    '🐦',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🐦', key: mek.key } });

        const gameHtml = `<style>
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", sans-serif; color: #fff; touch-action: none; overflow: hidden; }
.wrapper { width: 100%; max-width: 480px; margin: auto; padding: 12px; }
.card { background: linear-gradient(180deg, rgba(15,18,26,0.97), rgba(10,12,18,0.97)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 2px solid #38bdf8; border-radius: 20px; overflow: hidden; box-shadow: 0 14px 44px rgba(0,0,0,0.75), inset 0 0 40px rgba(56,189,248,0.06); padding: 14px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.title { font-size: 10px; letter-spacing: 1.5px; color: #38bdf8; font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px; }
.title .dot{ width:6px; height:6px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981; animation: pulse 1.4s infinite; }
@keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.3} }
.score-badge { font-size: 20px; font-weight: 900; color: #fbbf24; text-shadow: 0 0 12px rgba(251,191,36,0.6); font-variant-numeric: tabular-nums; }
.best-badge { font-size: 10px; color: #94a3b8; font-variant-numeric: tabular-nums; }
.stat-row { display:flex; gap:8px; margin-bottom:8px; }
.stat-pill { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:5px 8px; text-align:center; }
.stat-pill .lbl{ font-size:8px; letter-spacing:1px; color:#64748b; text-transform:uppercase; font-weight:700; }
.stat-pill .val{ font-size:13px; font-weight:900; color:#fff; font-variant-numeric: tabular-nums; }
#game-container { position: relative; width: 100%; height: 340px; border-radius: 14px; overflow: hidden; border: 2px solid #1e293b; box-shadow: inset 0 0 30px rgba(0,0,0,0.6); }
canvas { width: 100%; height: 100%; display: block; background: #4ec0ca; touch-action: none; }
.tap-hint { margin-top: 8px; text-align: center; font-size: 10px; color: #64748b; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 8px; }
.credit-bar { margin-top: 8px; text-align: center; font-size: 9px; font-weight: 700; letter-spacing: 1.2px; color: #64748b; text-transform: uppercase; }
.credit-bar span { color: #38bdf8; font-weight: 900; text-shadow: 0 0 8px rgba(56,189,248,0.5); }
</style>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div>
        <div class="title"><span class="dot"></span>SHAVIYA XMD</div>
        <h2 style="font-size: 17px; font-weight: 900; color: #fff; margin-top:2px;">Flappy Bird 🐦</h2>
      </div>
      <div style="text-align: right;">
        <div class="score-badge" id="score">000</div>
        <div class="best-badge" id="best">BEST 000</div>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-pill"><div class="lbl">Score</div><div class="val" id="scoreStat">0</div></div>
      <div class="stat-pill"><div class="lbl">Pipes</div><div class="val" id="pipeStat">0</div></div>
      <div class="stat-pill"><div class="lbl">Best</div><div class="val" id="bestStat">0</div></div>
    </div>

    <div id="game-container">
      <canvas id="c"></canvas>
    </div>

    <div class="tap-hint">👆 TAP TO FLAP</div>

    <div class="credit-bar">Developed by <span>Savendra Dampriya</span></div>
  </div>
</div>

<script>
(function() {
  var cvs = document.getElementById('c');
  var ctx = cvs.getContext('2d');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var scoreStatEl = document.getElementById('scoreStat');
  var pipeStatEl = document.getElementById('pipeStat');
  var bestStatEl = document.getElementById('bestStat');

  var W = 360;
  var H = 340;
  cvs.width = W;
  cvs.height = H;

  // ═══════════════ CONSTANTS ═══════════════
  var GROUND_H = 60;
  var FLOOR_Y = H - GROUND_H;
  var GRAVITY = 0.42;
  var FLAP_V = -7.0;
  var MAX_V = 10;
  var PIPE_W = 58;
  var GAP = 135;
  var PIPE_SPACING = 190;

  // ═══════════════ GAME STATE ═══════════════
  var bird = { x: 80, y: H / 2, r: 13, vy: 0, rot: 0, wingPhase: 0 };
  var pipes = [];
  var particles = [];
  var clouds = [];
  var score = 0;
  var best = 0;
  var pipesPassed = 0;
  var started = false;
  var gameOver = false;
  var frame = 0;
  var shake = 0;
  var flashAlpha = 0;
  var groundOffset = 0;
  var baseSpeed = 2.2;
  var speed = baseSpeed;
  var lastTime = 0;
  var deltaTime = 16;

  try { best = parseInt(localStorage.getItem('flappy_best_v2') || '0', 10) || 0; } catch(e){}
  bestEl.textContent = 'BEST ' + String(best).padStart(3, '0');
  bestStatEl.textContent = best;

  // ═══════════════ PRE-COMPUTED GRADIENTS ═══════════════
  // Sky gradient (created once)
  var skyGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  skyGrad.addColorStop(0, '#4ec0ca');
  skyGrad.addColorStop(0.55, '#7dd3dc');
  skyGrad.addColorStop(1, '#b8e6a0');

  // Pipe gradient (created once)
  var pipeGradLeft = 0;
  var pipeGradRight = PIPE_W;
  function makePipeGrad(x) {
    var g = ctx.createLinearGradient(x, 0, x + PIPE_W, 0);
    g.addColorStop(0, '#4a9c3a');
    g.addColorStop(0.15, '#6ec44a');
    g.addColorStop(0.5, '#8ee85e');
    g.addColorStop(0.85, '#5cb84a');
    g.addColorStop(1, '#3d7d30');
    return g;
  }

  // ═══════════════ INIT CLOUDS ═══════════════
  for (var i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * W,
      y: 20 + Math.random() * 100,
      w: 50 + Math.random() * 50,
      spd: 0.15 + Math.random() * 0.2
    });
  }

  // ═══════════════ RESET ═══════════════
  function reset() {
    bird.x = 80;
    bird.y = H / 2;
    bird.vy = 0;
    bird.rot = 0;
    bird.wingPhase = 0;
    pipes = [];
    particles = [];
    score = 0;
    pipesPassed = 0;
    started = false;
    gameOver = false;
    frame = 0;
    shake = 0;
    flashAlpha = 0;
    speed = baseSpeed;
    groundOffset = 0;
    scoreEl.textContent = '000';
    scoreStatEl.textContent = '0';
    pipeStatEl.textContent = '0';
  }

  // ═══════════════ FLAP (optimized) ═══════════════
  function flap() {
    if (gameOver) { reset(); return; }
    if (!started) started = true;
    bird.vy = FLAP_V;
    bird.wingPhase = 10;
    // Minimal particles (2 instead of 4)
    if (particles.length < 25) {
      for (var i = 0; i < 2; i++) {
        particles.push({
          x: bird.x - 6 + Math.random() * 4,
          y: bird.y + 4 + Math.random() * 4,
          vx: -1.5 - Math.random(),
          vy: Math.random() * 1.5 - 0.7,
          life: 1,
          size: 2,
          color: '#fff'
        });
      }
    }
  }

  // ═══════════════ SPAWN PIPE ═══════════════
  function spawnPipe() {
    var minTop = 50;
    var maxTop = FLOOR_Y - GAP - 60;
    var topH = minTop + Math.random() * (maxTop - minTop);
    pipes.push({
      x: W + 20,
      topH: topH,
      bottomY: topH + GAP,
      passed: false
    });
  }

  // ═══════════════ EXPLODE ═══════════════
  function explode(x, y, color) {
    if (particles.length > 50) return; // cap
    for (var i = 0; i < 14; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 1.5 + Math.random() * 3.5;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        life: 1,
        size: 2 + Math.random() * 2.5,
        color: color
      });
    }
    shake = 8;
    flashAlpha = 0.35;
  }

  // ═══════════════ DRAW SKY (optimized) ═══════════════
  function drawSky() {
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, FLOOR_Y);

    // Clouds (no save/restore)
    for (var i = 0; i < clouds.length; i++) {
      var cl = clouds[i];
      if (started && !gameOver) {
        cl.x -= cl.spd;
        if (cl.x + cl.w < -20) {
          cl.x = W + 20;
          cl.y = 20 + Math.random() * 100;
        }
      }
      // Simple cloud — 3 circles instead of 4
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(cl.x, cl.y, cl.w * 0.3, 0, Math.PI * 2);
      ctx.arc(cl.x + cl.w * 0.25, cl.y - 4, cl.w * 0.24, 0, Math.PI * 2);
      ctx.arc(cl.x + cl.w * 0.48, cl.y, cl.w * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    // City silhouette
    ctx.fillStyle = 'rgba(160,220,140,0.4)';
    for (var cx = 0; cx < W; cx += 50) {
      var bh = 25 + Math.sin(cx * 0.3) * 12;
      ctx.fillRect(cx, FLOOR_Y - bh - 20, 38, bh);
    }
  }

  // ═══════════════ DRAW GROUND (classic Flappy floor) ═══════════════
  function drawGround() {
    // Base (tan)
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, FLOOR_Y, W, GROUND_H);

    // Green top strip
    ctx.fillStyle = '#7dc95e';
    ctx.fillRect(0, FLOOR_Y, W, 12);

    // Darker green edge
    ctx.fillStyle = '#5cb84a';
    ctx.fillRect(0, FLOOR_Y + 10, W, 3);

    // Checkered pattern
    if (started && !gameOver) {
      groundOffset = (groundOffset + speed) % 20;
    }
    ctx.fillStyle = '#4a8f3a';
    var startX = -20 + groundOffset;
    for (var x = startX; x < W + 20; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y + 13);
      ctx.lineTo(x + 10, FLOOR_Y + 13);
      ctx.lineTo(x + 6, FLOOR_Y + 22);
      ctx.lineTo(x - 4, FLOOR_Y + 22);
      ctx.closePath();
      ctx.fill();
    }

    // Bottom texture dots
    ctx.fillStyle = '#b8a860';
    for (var dx = 0; dx < W; dx += 12) {
      var dy = FLOOR_Y + 32 + (dx % 24 === 0 ? 4 : 0);
      ctx.fillRect(dx, dy, 4, 3);
    }
  }

  // ═══════════════ DRAW PIPE (premium texture) ═══════════════
  function drawPipe(p) {
    var x = p.x;
    var pipeGrad = makePipeGrad(x);

    // ═══ TOP PIPE ═══
    // Body
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(x, 0, PIPE_W, p.topH);

    // Vertical highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + 8, 0, 5, p.topH - 24);
    // Darker edge on right
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x + PIPE_W - 8, 0, 8, p.topH - 24);

    // Cap
    var capY = p.topH - 24;
    ctx.fillStyle = '#3d7d30';
    ctx.fillRect(x - 4, capY, PIPE_W + 8, 24);
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(x - 4, capY + 2, PIPE_W + 8, 20);
    // Cap highlights
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - 1, capY + 4, 5, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x + PIPE_W - 2, capY + 4, 5, 16);
    // Cap outline
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 4, capY, PIPE_W + 8, 24);

    // ═══ BOTTOM PIPE ═══
    var bY = p.bottomY;
    var bH = FLOOR_Y - bY;

    ctx.fillStyle = pipeGrad;
    ctx.fillRect(x, bY, PIPE_W, bH);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + 8, bY + 26, 5, bH - 30);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x + PIPE_W - 8, bY + 26, 8, bH - 30);

    // Cap
    ctx.fillStyle = '#3d7d30';
    ctx.fillRect(x - 4, bY, PIPE_W + 8, 24);
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(x - 4, bY + 2, PIPE_W + 8, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - 1, bY + 4, 5, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x + PIPE_W - 2, bY + 4, 5, 16);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 4, bY, PIPE_W + 8, 24);
  }

  // ═══════════════ DRAW BIRD (premium texture) ═══════════════
  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    var rot = Math.max(-0.5, Math.min(1.2, bird.vy * 0.07));
    ctx.rotate(rot);

    // Shadow under bird
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 10, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body base (yellow)
    ctx.fillStyle = '#fdd835';
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fill();

    // Body gradient (bottom darker)
    ctx.fillStyle = '#f9a825';
    ctx.beginPath();
    ctx.arc(0, 3, bird.r - 1, 0, Math.PI);
    ctx.fill();

    // Top highlight
    ctx.fillStyle = '#ffe97a';
    ctx.beginPath();
    ctx.arc(-3, -4, 7, 0, Math.PI * 2);
    ctx.fill();

    // White belly
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(1, 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Wing (animated)
    var wingUp = bird.wingPhase > 0;
    var wingY = wingUp ? -7 : 3;
    var wingH = wingUp ? 11 : 8;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-5, wingY, 8, wingH * 0.65, wingUp ? -0.5 : -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Wing outline
    ctx.strokeStyle = '#e0c040';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Wing inner
    ctx.fillStyle = '#f0e080';
    ctx.beginPath();
    ctx.ellipse(-5, wingY + 1, 5, wingH * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye (white)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    // Eye outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Pupil
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(7.5, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Eye highlight
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(8.3, -6, 1, 0, Math.PI * 2);
    ctx.fill();

    // Beak (upper — orange)
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.moveTo(11, -3);
    ctx.lineTo(20, 0);
    ctx.lineTo(11, 3);
    ctx.closePath();
    ctx.fill();
    // Beak outline
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Beak (lower — darker orange)
    ctx.fillStyle = '#ef6c00';
    ctx.beginPath();
    ctx.moveTo(11, 1);
    ctx.lineTo(18, 2);
    ctx.lineTo(11, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ═══════════════ UPDATE LOOP ═══════════════
  function update() {
    frame++;
    var dt = Math.min(deltaTime / 16, 2); // normalize to 60fps

    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      shake *= 0.85;
      if (shake < 0.5) shake = 0;
    }

    drawSky();
    drawGround();

    // ═══ BIRD PHYSICS (delta-timed) ═══
    if (started && !gameOver) {
      bird.vy += GRAVITY * dt;
      if (bird.vy > MAX_V) bird.vy = MAX_V;
      bird.y += bird.vy * dt;

      // Wing animation decay
      if (bird.wingPhase > 0) bird.wingPhase -= dt;

      // Ceiling
      if (bird.y < bird.r) {
        bird.y = bird.r;
        bird.vy = 0;
      }

      // Floor collision
      if (bird.y + bird.r > FLOOR_Y) {
        bird.y = FLOOR_Y - bird.r;
        gameOver = true;
        explode(bird.x, bird.y, '#fdd835');
      }

      // Speed progression
      speed = baseSpeed + Math.min(score / 10, 2);
    }

    // ═══ SPAWN PIPES ═══
    if (started && !gameOver) {
      if (pipes.length === 0 || (pipes[pipes.length - 1].x < W - PIPE_SPACING)) {
        spawnPipe();
      }
    }

    // ═══ UPDATE & DRAW PIPES ═══
    for (var i = pipes.length - 1; i >= 0; i--) {
      var p = pipes[i];
      if (started && !gameOver) p.x -= speed * dt;
      drawPipe(p);

      // Score when passing
      if (!p.passed && p.x + PIPE_W < bird.x) {
        p.passed = true;
        score++;
        pipesPassed++;
        scoreEl.textContent = String(score).padStart(3, '0');
        scoreStatEl.textContent = score;
        pipeStatEl.textContent = pipesPassed;
        if (score > best) {
          best = score;
          try { localStorage.setItem('flappy_best_v2', String(best)); } catch(e){}
          bestEl.textContent = 'BEST ' + String(best).padStart(3, '0');
          bestStatEl.textContent = best;
        }
      }

      // Collision
      if (!gameOver) {
        var bx = bird.x, by = bird.y, br = bird.r - 2;
        if (bx + br > p.x && bx - br < p.x + PIPE_W) {
          if (by - br < p.topH || by + br > p.bottomY) {
            gameOver = true;
            explode(bird.x, bird.y, '#fdd835');
            explode(p.x + PIPE_W / 2, p.topH, '#5cb84a');
          }
        }
      }

      if (p.x + PIPE_W < -20) pipes.splice(i, 1);
    }

    // ═══ DRAW BIRD ═══
    if (!gameOver) drawBird();

    // ═══ PARTICLES (optimized) ═══
    for (var pi = particles.length - 1; pi >= 0; pi--) {
      var pt = particles[pi];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 0.15 * dt;
      pt.life -= 0.04 * dt;
      if (pt.life <= 0) { particles.splice(pi, 1); continue; }
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Flash
    if (flashAlpha > 0.01) {
      ctx.fillStyle = 'rgba(255,255,255,' + flashAlpha + ')';
      ctx.fillRect(-10, -10, W + 20, H + 20);
      flashAlpha *= 0.88;
    }

    // ═══ START SCREEN ═══
    if (!started && !gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';

      // Title
      ctx.fillStyle = '#fff';
      ctx.font = '900 32px sans-serif';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeText('FLAPPY', W / 2, H / 2 - 40);
      ctx.fillText('FLAPPY', W / 2, H / 2 - 40);
      ctx.strokeText('BIRD', W / 2, H / 2 - 5);
      ctx.fillText('BIRD', W / 2, H / 2 - 5);

      // Play button circle
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2 + 55, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Play triangle
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(W / 2 - 8, H / 2 + 42);
      ctx.lineTo(W / 2 + 13, H / 2 + 55);
      ctx.lineTo(W / 2 - 8, H / 2 + 68);
      ctx.closePath();
      ctx.fill();
    }

    // ═══ GAME OVER ═══
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.textAlign = 'center';

      ctx.fillStyle = '#fff';
      ctx.font = '900 30px sans-serif';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeText('GAME OVER', W / 2, H / 2 - 60);
      ctx.fillText('GAME OVER', W / 2, H / 2 - 60);

      // Score card
      ctx.fillStyle = 'rgba(255,255,255,0.98)';
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      roundRect(W / 2 - 95, H / 2 - 30, 190, 95, 14);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#94a3b8';
      ctx.font = '800 10px sans-serif';
      ctx.fillText('SCORE', W / 2 - 45, H / 2 - 8);
      ctx.fillText('BEST', W / 2 + 45, H / 2 - 8);

      ctx.fillStyle = '#f97316';
      ctx.font = '900 28px sans-serif';
      ctx.fillText(String(score), W / 2 - 45, H / 2 + 22);
      ctx.fillText(String(best), W / 2 + 45, H / 2 + 22);

      ctx.fillStyle = '#10b981';
      ctx.font = '900 13px sans-serif';
      ctx.fillText('TAP TO RESTART', W / 2, H / 2 + 85);
    }

    ctx.restore();
    requestAnimationFrame(update);
  }

  // Rounded rect helper
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ═══════════════ CONTROLS ═══════════════
  function handleTap(e) {
    e.preventDefault();
    flap();
  }

  cvs.addEventListener('pointerdown', handleTap);
  cvs.addEventListener('touchstart', handleTap, { passive: false });

  // Keyboard
  window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      flap();
    }
  });

  // ═══════════════ START ═══════════════
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
                        submessages: [{ messageType: 2, messageText: "Flappy Bird 🐦" }],
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
                                "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGHsL0Ccm0ELINFZ2IaBhKaeWnVuh0o6nZLCioCn9xpSADzwIS5VCWO+1eVXT2atJOyf7FYlpB0/JA3Us+aQtekuIkHu/zBXijORZ4ClF4+sF3cSTNg6gY/+6iwLK/zs3bMg+GeJrcI65vXfs95Shxlb2Rd5GRT2/2yBmR6Zkf5QwMJuptUHWtM26WY7/xlkEKGFYDZVqOSylusiOzSALa815zC6dCiHoJNLBEKMlaZZQOk57/+OYoU5zzTaEgLhyvNFHSyAlyLQ3SGFtVHAaJZHSmmSPyJowCOB+92Gkk6SWVMsk6FbU8QJWFtlhzV/W/gZ7WzUlS/AKgN0th9/cq20ToFkW7X9c+rtYavufmuieqFhXgaMD8AGsoN9QC/HzNC9D1nydPfFYEUr9BHVy2nF5gM58Y59r2rT8p5LPARIkUp8g+5DLhyW0tdZFZ1305o4AHCayZnp5rjcU2Xi/c1Qf/djBGakmijlMs4aMzKJYD0c4Q8jdI7sNyd876K2wRD+L6KeD2QB3PtCS4P7BWAl5gh5CJ6ZBrwcaKXZqcSjEwm52MqVCgg"
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
        console.error('Flappy Send Error:', err);
        return reply('❌ Flappy Bird load error');
    }
});
