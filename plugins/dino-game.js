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
        const gameHtml = `<style>
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", sans-serif; color: #fff; touch-action: none; overflow: hidden; }
.wrapper { width: 100%; max-width: 480px; margin: auto; padding: 12px; }
.card { background: linear-gradient(180deg, rgba(15,18,26,0.97), rgba(10,12,18,0.97)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 2px solid #535353; border-radius: 20px; overflow: hidden; box-shadow: 0 14px 44px rgba(0,0,0,0.75); padding: 14px; position: relative; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.title { font-size: 10px; letter-spacing: 1.5px; color: #535353; font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:6px; }
.title .dot{ width:6px; height:6px; border-radius:50%; background:#535353; box-shadow:0 0 8px #535353; animation: pulse 1.4s infinite; }
@keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.3} }
.score-badge { font-size: 20px; font-weight: 900; color: #535353; font-variant-numeric: tabular-nums; font-family: monospace; letter-spacing: 2px; }
.best-badge { font-size: 10px; color: #737373; font-variant-numeric: tabular-nums; font-family: monospace; }
.stat-row { display:flex; gap:8px; margin-bottom:8px; }
.stat-pill { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:5px 8px; text-align:center; }
.stat-pill .lbl{ font-size:8px; letter-spacing:1px; color:#64748b; text-transform:uppercase; font-weight:700; }
.stat-pill .val{ font-size:13px; font-weight:900; color:#fff; font-variant-numeric: tabular-nums; }
#game-container { position: relative; width: 100%; height: 300px; border-radius: 14px; overflow: hidden; border: 2px solid #1e293b; box-shadow: inset 0 0 30px rgba(0,0,0,0.6); }
canvas { width: 100%; height: 100%; display: block; background: #f7f7f7; touch-action: none; }
.tap-hint { margin-top: 10px; text-align: center; font-size: 10px; color: #64748b; letter-spacing: 2px; font-weight: 800; text-transform: uppercase; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 10px; }
.credit-bar { margin-top: 10px; text-align: center; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #94a3b8; text-transform: uppercase; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 8px; }
.credit-bar span { color: #535353; text-shadow: 0 0 10px rgba(83,83,83,0.5); }
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
        <div class="best-badge" id="best">HI 00000</div>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-pill"><div class="lbl">Speed</div><div class="val" id="speedStat">1.0x</div></div>
      <div class="stat-pill"><div class="lbl">Distance</div><div class="val" id="distStat">0m</div></div>
      <div class="stat-pill"><div class="lbl">Time</div><div class="val" id="timeStat">0s</div></div>
    </div>

    <div id="game-container">
      <canvas id="c"></canvas>
    </div>

    <div class="tap-hint">👆 TAP SCREEN TO JUMP</div>

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
  var distStatEl = document.getElementById('distStat');
  var timeStatEl = document.getElementById('timeStat');

  var W = 360;
  var H = 300;
  cvs.width = W;
  cvs.height = H;

  // Disable image smoothing for pixelated Chrome-dino look
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  var GROUND_Y = H - 40;
  var GRAVITY = 0.65;
  var JUMP_V = -12.5;

  var gameOver = false;
  var started = false;
  var score = 0;
  var best = 0;
  var timeAlive = 0;
  var distance = 0;
  var baseSpeed = 5;
  var speed = baseSpeed;
  var frame = 0;
  var shake = 0;
  var flashAlpha = 0;

  try { best = parseInt(localStorage.getItem('dino_best_v2') || '0', 10) || 0; } catch(e){}
  bestEl.textContent = 'HI ' + String(best).padStart(5, '0');

  // Dino object
  var dino = {
    x: 50,
    y: GROUND_Y - 44,
    w: 44,
    h: 44,
    vy: 0,
    onGround: true,
    legFrame: 0,
    blink: 0,
    dead: false
  };

  var obstacles = [];
  var particles = [];
  var groundDots = [];
  var clouds = [];

  // Ground dots
  for (var i = 0; i < 40; i++) {
    groundDots.push({
      x: Math.random() * W,
      y: GROUND_Y + 4 + Math.random() * 22,
      size: 1 + Math.random() * 2
    });
  }

  // Clouds
  for (var i = 0; i < 3; i++) {
    clouds.push({
      x: Math.random() * W,
      y: 30 + Math.random() * 60,
      w: 40 + Math.random() * 30,
      spd: 0.2 + Math.random() * 0.2
    });
  }

  var spawnCounter = 0;

  function reset() {
    gameOver = false;
    started = true;
    score = 0;
    distance = 0;
    timeAlive = 0;
    speed = baseSpeed;
    obstacles = [];
    particles = [];
    frame = 0;
    shake = 0;
    flashAlpha = 0;
    dino.y = GROUND_Y - 44;
    dino.vy = 0;
    dino.onGround = true;
    dino.dead = false;
    scoreEl.textContent = '00000';
    distStatEl.textContent = '0m';
    timeStatEl.textContent = '0s';
    speedStatEl.textContent = '1.0x';
  }

  function jump() {
    if (gameOver) { reset(); return; }
    if (!started) { started = true; }
    if (dino.onGround) {
      dino.vy = JUMP_V;
      dino.onGround = false;
      // Dust particles
      for (var i = 0; i < 6; i++) {
        particles.push({
          x: dino.x + 20, y: GROUND_Y - 2,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 2,
          life: 1, size: 2 + Math.random() * 2,
          color: '#999'
        });
      }
    }
  }

  function spawnObstacle() {
    var r = Math.random();
    var w, h, type;
    if (r < 0.5) {
      // Small cactus (single)
      w = 18; h = 34; type = 'cactus_small';
    } else if (r < 0.8) {
      // Large cactus (single)
      w = 26; h = 48; type = 'cactus_large';
    } else if (r < 0.95) {
      // Double cactus group
      w = 40; h = 42; type = 'cactus_double';
    } else {
      // Triple cactus group
      w = 60; h = 38; type = 'cactus_triple';
    }
    obstacles.push({
      type: type,
      x: W + 10,
      y: GROUND_Y - h,
      w: w, h: h,
      scored: false
    });
  }

  // ─────────────────────────────────────
  //  REAL CHROME DINO TEXTURE — pixel art
  // ─────────────────────────────────────

  // Helper: draw filled rect
  function px(x, y, w, h) {
    ctx.fillRect(x, y, w, h);
  }

  function drawDino() {
    var x = Math.floor(dino.x);
    var y = Math.floor(dino.y);

    // Chrome dino color: #535353
    ctx.fillStyle = '#535353';

    // Running frame (legs)
    var legFrame = Math.floor(frame / 6) % 2;
    var blink = dino.blink > 0;

    // ═══════ DINO PIXEL BODY (based on Chrome dino) ═══════
    // Head
    px(x + 22, y + 2, 20, 16);
    // Snout
    px(x + 38, y + 6, 6, 4);
    // Neck
    px(x + 22, y + 14, 8, 8);
    // Back/Body
    px(x + 4, y + 14, 22, 20);
    // Tail (small piece on left)
    px(x, y + 18, 4, 6);
    px(x - 2, y + 20, 2, 4);

    // Arm (small)
    px(x + 26, y + 22, 8, 3);
    px(x + 30, y + 25, 4, 3);

    // Eye (white background cut-out then dark pupil)
    if (blink) {
      // Closed eye — horizontal line
      ctx.fillStyle = '#f7f7f7';
      px(x + 34, y + 8, 4, 1);
      ctx.fillStyle = '#535353';
    } else {
      // Open eye — white square then black dot
      ctx.fillStyle = '#f7f7f7';
      px(x + 33, y + 7, 5, 5);
      ctx.fillStyle = '#535353';
      px(x + 35, y + 8, 2, 3);
      // Mouth (line under eye)
      px(x + 38, y + 12, 5, 1);
    }

    // Legs (animated)
    ctx.fillStyle = '#535353';
    if (dino.onGround) {
      if (legFrame === 0) {
        // Leg 1 down, leg 2 up
        px(x + 10, y + 34, 5, 10);
        px(x + 10, y + 42, 7, 2);
        px(x + 22, y + 34, 5, 8);
        px(x + 22, y + 40, 6, 2);
      } else {
        // Leg 1 up, leg 2 down
        px(x + 10, y + 34, 5, 8);
        px(x + 10, y + 40, 6, 2);
        px(x + 22, y + 34, 5, 10);
        px(x + 22, y + 42, 7, 2);
      }
    } else {
      // Airborne — legs tucked
      px(x + 10, y + 34, 5, 8);
      px(x + 22, y + 34, 5, 8);
    }

    // Shadow under dino
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x + 22, GROUND_Y + 1, 20, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawObstacle(o) {
    ctx.fillStyle = '#535353';

    if (o.type === 'cactus_small') {
      // Single small cactus
      var cx = o.x;
      // Main trunk
      px(cx + 6, o.y, 6, 34);
      // Left arm
      px(cx, o.y + 12, 6, 3);
      px(cx, o.y + 12, 3, 12);
      // Right arm
      px(cx + 12, o.y + 8, 6, 3);
      px(cx + 15, o.y + 8, 3, 14);
      // Top spikes
      px(cx + 7, o.y - 2, 4, 2);
    } else if (o.type === 'cactus_large') {
      var cx2 = o.x;
      px(cx2 + 8, o.y, 8, 48);
      px(cx2, o.y + 18, 8, 4);
      px(cx2, o.y + 18, 4, 16);
      px(cx2 + 16, o.y + 12, 8, 4);
      px(cx2 + 20, o.y + 12, 4, 20);
      px(cx2 + 9, o.y - 3, 6, 3);
    } else if (o.type === 'cactus_double') {
      // Two cacti close together
      var cx3 = o.x;
      // Cactus 1
      px(cx3 + 4, o.y, 6, 42);
      px(cx3, o.y + 15, 6, 3);
      px(cx3, o.y + 15, 3, 12);
      // Cactus 2
      px(cx3 + 22, o.y + 2, 6, 40);
      px(cx3 + 28, o.y + 18, 6, 3);
      px(cx3 + 31, o.y + 18, 3, 12);
      px(cx3 + 24, o.y - 1, 4, 3);
    } else if (o.type === 'cactus_triple') {
      // Three cacti
      var cx4 = o.x;
      // Cactus 1
      px(cx4, o.y + 8, 6, 30);
      px(cx4 + 6, o.y + 15, 4, 3);
      // Cactus 2 (tallest)
      px(cx4 + 16, o.y, 8, 38);
      px(cx4 + 12, o.y + 14, 6, 3);
      px(cx4 + 12, o.y + 14, 3, 10);
      px(cx4 + 24, o.y + 10, 6, 3);
      px(cx4 + 27, o.y + 10, 3, 14);
      // Cactus 3
      px(cx4 + 42, o.y + 6, 6, 32);
      px(cx4 + 36, o.y + 16, 6, 3);
      px(cx4 + 36, o.y + 16, 3, 12);
    }
  }

  function drawGround() {
    // Sky (Chrome dino is white/light)
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, W, H);

    // Clouds
    for (var ci = 0; ci < clouds.length; ci++) {
      var cl = clouds[ci];
      if (!gameOver && started) cl.x -= cl.spd * (speed / baseSpeed);
      if (cl.x + cl.w < -10) { cl.x = W + 20; cl.y = 20 + Math.random() * 70; }
      ctx.fillStyle = '#c8c8c8';
      // Pixel cloud
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, cl.w * 0.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cl.x + 12, cl.y - 3, cl.w * 0.3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground line
    ctx.fillStyle = '#535353';
    ctx.fillRect(0, GROUND_Y, W, 2);

    // Ground dots (moving)
    if (!gameOver && started) {
      for (var gi = 0; gi < groundDots.length; gi++) {
        var g = groundDots[gi];
        g.x -= speed;
        if (g.x < -5) {
          g.x = W + 5;
          g.y = GROUND_Y + 4 + Math.random() * 22;
        }
      }
    }
    ctx.fillStyle = '#999';
    for (var gi2 = 0; gi2 < groundDots.length; gi2++) {
      var g2 = groundDots[gi2];
      ctx.fillRect(Math.floor(g2.x), Math.floor(g2.y), Math.floor(g2.size * 3), Math.floor(g2.size));
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

    drawGround();

    if (started && !gameOver) {
      speed = baseSpeed + Math.min(score / 500, 6);
      speedStatEl.textContent = (speed / baseSpeed).toFixed(1) + 'x';
      score += 1;
      distance += Math.floor(speed / 2);
      scoreEl.textContent = String(score).padStart(5, '0');
      distStatEl.textContent = distance + 'm';
      timeAlive = Math.floor(frame / 60);
      timeStatEl.textContent = timeAlive + 's';

      if (score > best) {
        best = score;
        try { localStorage.setItem('dino_best_v2', String(best)); } catch(e){}
        bestEl.textContent = 'HI ' + String(best).padStart(5, '0');
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
          for (var lp = 0; lp < 5; lp++) {
            particles.push({
              x: dino.x + 20 + (Math.random() - 0.5) * 20,
              y: GROUND_Y - 2,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 2,
              life: 1, size: 1 + Math.random() * 2,
              color: '#999'
            });
          }
        }
      }

      // Spawn obstacles
      spawnCounter++;
      var gap = Math.max(50, 90 - Math.floor(score / 80));
      if (spawnCounter > gap) {
        spawnObstacle();
        spawnCounter = 0;
      }
    }

    // Draw obstacles
    for (var oi = obstacles.length - 1; oi >= 0; oi--) {
      var o = obstacles[oi];
      if (!gameOver && started) o.x -= speed;
      drawObstacle(o);

      // Collision
      var dinoBox = {
        x: dino.x + 8, y: dino.y + 4,
        w: 30, h: 40
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
          dino.dead = true;
          explode(dino.x + 20, dino.y + 20, '#535353');
          explode(o.x + o.w / 2, o.y + o.h / 2, '#535353');
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
      ctx.fillStyle = 'rgba(247,247,247,0.85)';
      ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#535353';
      ctx.font = '900 24px monospace';
      ctx.fillText('DINO RUNNER', W / 2, H / 2 - 20);
      ctx.fillStyle = '#535353';
      ctx.font = '900 13px sans-serif';
      ctx.fillText('TAP TO START', W / 2, H / 2 + 10);
      ctx.fillStyle = '#737373';
      ctx.font = '600 10px sans-serif';
      ctx.fillText('Jump over cacti · Tap screen to jump', W / 2, H / 2 + 32);
    }

    // Game over screen
    if (gameOver) {
      ctx.fillStyle = 'rgba(247,247,247,0.9)';
      ctx.fillRect(-10, -10, W + 20, H + 20);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#535353';
      ctx.font = '900 22px monospace';
      ctx.fillText('G A M E  O V E R', W / 2, H / 2 - 35);

      ctx.fillStyle = '#535353';
      ctx.font = '900 15px monospace';
      ctx.fillText('Score: ' + score, W / 2, H / 2 - 5);

      ctx.fillStyle = '#737373';
      ctx.font = '700 12px monospace';
      ctx.fillText('HI: ' + best + '  ·  ' + distance + 'm  ·  ' + timeAlive + 's', W / 2, H / 2 + 20);

      ctx.fillStyle = '#535353';
      ctx.font = '900 13px sans-serif';
      ctx.fillText('TAP TO RESTART', W / 2, H / 2 + 55);
    }

    ctx.restore();
    requestAnimationFrame(update);
  }

  // Only tap-to-jump (no duck)
  function handleTap(e) {
    e.preventDefault();
    jump();
  }

  cvs.addEventListener('pointerdown', handleTap);
  cvs.addEventListener('touchstart', handleTap, { passive: false });

  // Keyboard for desktop
  window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      jump();
    }
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
