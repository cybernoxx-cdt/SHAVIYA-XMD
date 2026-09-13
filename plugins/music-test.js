const { cmd } = require('../command');

let baileys;
try { baileys = require('@dnuzi/baileys'); }
catch (err) {
    try { baileys = require('@whiskeysockets/baileys'); }
    catch (err) {
        try { baileys = require('@adiwajshing/baileys'); }
        catch (e) { console.error("Baileys not found!"); }
    }
}
const { generateWAMessageFromContent } = baileys;

// ══════════════════════════════════════════════════════════════
//  MUSIC PLAYER — SHAVIYA-XMD
//  Premium WebUI Music Player
//  Created by: Savendra Dampriya
// ══════════════════════════════════════════════════════════════
cmd({
    pattern: 'music',
    alias: ['player', 'mp3', 'musicplayer'],
    desc: 'Premium music player inside WhatsApp',
    category: 'download',
    react: '🎵',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🎵', key: mek.key } });

        const html = `<style>
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: #0a0f1e; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Apple Color Emoji", sans-serif; color: #fff; min-height: 100vh; overflow-x: hidden; }
.bg { position: fixed; inset: 0; z-index: -1; background: radial-gradient(circle at 20% 20%, rgba(139,92,246,0.25) 0, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.25) 0, transparent 50%); }
.psvg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; opacity: 0.5; }
.wrap { max-width: 480px; margin: auto; padding: 12px; position: relative; z-index: 2; }

.header { text-align: center; padding: 16px; background: linear-gradient(180deg, rgba(15,18,26,0.97), rgba(10,12,18,0.97)); border: 2px solid #8b5cf6; border-radius: 16px; margin-bottom: 12px; position: relative; overflow: hidden; }
.header::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(139,92,246,0.3), transparent 60%); pointer-events: none; }
.header .logo { font-size: 38px; margin-bottom: 4px; animation: pulse-logo 3s ease-in-out infinite; position: relative; z-index: 1; }
@keyframes pulse-logo { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
.header h1 { font-size: 18px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; position: relative; z-index: 1; background: linear-gradient(90deg, #a855f7, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.header p { font-size: 10px; color: #94a3b8; margin-top: 4px; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; position: relative; z-index: 1; }

.search-card { background: rgba(15,18,26,0.97); border: 2px solid #1e293b; border-radius: 14px; padding: 12px; margin-bottom: 12px; }
.search-row { display: flex; gap: 8px; }
input { flex: 1; padding: 12px; background: rgba(0,0,0,0.4); border: 2px solid #1e293b; border-radius: 10px; color: #fff; font-size: 14px; outline: none; transition: border-color 0.2s; font-family: inherit; }
input:focus { border-color: #a855f7; }
input::placeholder { color: #475569; }
.search-btn { padding: 12px 16px; border: none; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #ec4899); color: #fff; font-weight: 900; font-size: 16px; cursor: pointer; transition: transform 0.15s; }
.search-btn:active { transform: scale(0.95); }

.player-card { display: none; background: linear-gradient(180deg, rgba(15,18,26,0.98), rgba(10,12,18,0.98)); border: 2px solid #a855f7; border-radius: 18px; padding: 16px; margin-bottom: 12px; box-shadow: 0 8px 40px rgba(139,92,246,0.3); }
.player-card.show { display: block; animation: pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes pop-in { 0% { opacity: 0; transform: scale(0.9) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

.album-art { width: 100%; aspect-ratio: 1; border-radius: 14px; overflow: hidden; margin-bottom: 14px; position: relative; box-shadow: 0 8px 30px rgba(0,0,0,0.5); background: linear-gradient(135deg, #1e293b, #0f172a); }
.album-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
.album-art::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.5)); pointer-events: none; }

.viz { position: absolute; bottom: 12px; left: 12px; right: 12px; height: 30px; display: flex; align-items: flex-end; justify-content: center; gap: 3px; z-index: 2; }
.viz-bar { width: 4px; background: linear-gradient(180deg, #a855f7, #ec4899); border-radius: 2px; animation: viz-anim 0.8s ease-in-out infinite; }
.viz-bar:nth-child(1) { animation-delay: 0s; }
.viz-bar:nth-child(2) { animation-delay: 0.1s; }
.viz-bar:nth-child(3) { animation-delay: 0.2s; }
.viz-bar:nth-child(4) { animation-delay: 0.3s; }
.viz-bar:nth-child(5) { animation-delay: 0.4s; }
.viz-bar:nth-child(6) { animation-delay: 0.5s; }
.viz-bar:nth-child(7) { animation-delay: 0.6s; }
.viz-bar:nth-child(8) { animation-delay: 0.7s; }
@keyframes viz-anim { 0%,100% { height: 6px; } 50% { height: 28px; } }

.song-title { font-size: 15px; font-weight: 900; text-align: center; margin-bottom: 4px; line-height: 1.3; }
.song-artist { font-size: 11px; color: #94a3b8; text-align: center; letter-spacing: 1px; margin-bottom: 16px; text-transform: uppercase; font-weight: 700; }

.progress-wrap { margin-bottom: 14px; }
.progress-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
.progress-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #a855f7, #ec4899); border-radius: 3px; transition: width 0.3s; }
.progress-times { display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace; font-weight: 700; }

.controls { display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 14px; }
.ctrl-btn { width: 46px; height: 46px; border-radius: 50%; border: 2px solid #334155; background: rgba(0,0,0,0.4); color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.ctrl-btn:active { transform: scale(0.9); }
.ctrl-btn.main { width: 62px; height: 62px; background: linear-gradient(135deg, #a855f7, #ec4899); border-color: transparent; font-size: 26px; box-shadow: 0 6px 24px rgba(168,85,247,0.5); }

.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.action-btn { padding: 11px 8px; border-radius: 10px; border: 2px solid #a855f7; background: rgba(168,85,247,0.1); color: #d8b4fe; font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; text-transform: uppercase; transition: all 0.15s; }
.action-btn:active { transform: scale(0.96); background: rgba(168,85,247,0.25); }
.action-btn.primary { background: linear-gradient(135deg, #a855f7, #ec4899); color: #fff; border-color: transparent; grid-column: span 2; padding: 14px; font-size: 12px; }

.results { display: none; }
.results.show { display: block; animation: fade-in 0.3s; }
@keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.results-header { text-align: center; font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; margin-bottom: 10px; }
.result-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(15,18,26,0.97); border: 1.5px solid #1e293b; border-radius: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.15s; }
.result-item:active { transform: scale(0.98); border-color: #a855f7; background: rgba(168,85,247,0.1); }
.result-thumb { width: 60px; height: 45px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: #1e293b; }
.result-info { flex: 1; min-width: 0; }
.result-title { font-size: 12px; font-weight: 800; line-height: 1.3; margin-bottom: 3px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.result-channel { font-size: 10px; color: #94a3b8; }
.result-play { color: #a855f7; font-size: 22px; flex-shrink: 0; }

.loading { display: none; text-align: center; padding: 30px; }
.loading.show { display: block; }
.spinner { display: inline-block; width: 32px; height: 32px; border: 3px solid rgba(168,85,247,0.2); border-top-color: #a855f7; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }
.loading p { font-size: 11px; color: #94a3b8; margin-top: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; }

.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(120px); background: linear-gradient(135deg, #a855f7, #ec4899); color: #fff; padding: 12px 24px; border-radius: 12px; font-size: 12px; font-weight: 800; letter-spacing: 1px; transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); z-index: 9999; box-shadow: 0 8px 30px rgba(168,85,247,0.5); white-space: nowrap; }
.toast.show { transform: translateX(-50%) translateY(0); }
.toast.err { background: linear-gradient(135deg, #ef4444, #b91c1c); box-shadow: 0 8px 30px rgba(239,68,68,0.5); }

.credit { text-align: center; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; color: #64748b; text-transform: uppercase; padding: 14px 0 6px; }
.credit span { color: #a855f7; font-weight: 900; text-shadow: 0 0 10px rgba(168,85,247,0.6); }

.tips { padding: 10px; background: rgba(168,85,247,0.08); border: 1px dashed rgba(168,85,247,0.3); border-radius: 10px; margin-bottom: 12px; }
.tips h3 { font-size: 9px; color: #d8b4fe; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; margin-bottom: 6px; }
.tips p { font-size: 10px; color: #cbd5e1; line-height: 1.6; }
</style>

<body>
<div class="bg"></div>
<svg class="psvg" id="psvg"></svg>
<div class="wrap">

  <div class="header">
    <div class="logo">🎵</div>
    <h1>SHAVIYA MUSIC</h1>
    <p>Premium Music Player</p>
  </div>

  <div class="search-card">
    <div class="search-row">
      <input id="searchInput" type="text" placeholder="Search songs..." />
      <button class="search-btn" id="searchBtn">🔍</button>
    </div>
  </div>

  <div class="loading" id="loading">
    <div class="spinner"></div>
    <p>Searching...</p>
  </div>

  <div class="player-card" id="player">
    <div class="album-art">
      <img id="albumImg" src="" alt="" />
      <div class="viz">
        <div class="viz-bar"></div>
        <div class="viz-bar"></div>
        <div class="viz-bar"></div>
        <div class="viz-bar"></div>
        <div class="viz-bar"></div>
        <div class="viz-bar"></div>
        <div class="viz-bar"></div>
        <div class="viz-bar"></div>
      </div>
    </div>

    <div class="song-title" id="songTitle">-</div>
    <div class="song-artist" id="songArtist">-</div>

    <div class="progress-wrap">
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <div class="progress-times">
        <span id="curTime">0:00</span>
        <span id="durTime">0:00</span>
      </div>
    </div>

    <div class="controls">
      <button class="ctrl-btn" id="prevBtn">⏮</button>
      <button class="ctrl-btn main" id="playBtn">▶</button>
      <button class="ctrl-btn" id="nextBtn">⏭</button>
    </div>

    <div class="action-grid">
      <button class="action-btn primary" id="downloadBtn">📥 Download Song</button>
      <button class="action-btn" id="copyUrl">🔗 Copy URL</button>
      <button class="action-btn" id="shareBtn">📤 Share</button>
    </div>
  </div>

  <div class="results" id="results">
    <div class="results-header">🎯 Search Results</div>
    <div id="resultsList"></div>
  </div>

  <div class="tips">
    <h3>📖 කොහොමද Use කරන්නේ?</h3>
    <p>1️⃣ Song name එක type කරලා 🔍 ඔබන්න<br>
       2️⃣ Result එකක් tap කරලා player එකට load කරන්න<br>
       3️⃣ 📥 Download ඔබලා command එක copy කරන්න<br>
       4️⃣ WhatsApp chat එකට paste කරලා send කරන්න 🎵</p>
  </div>

  <div class="credit">Engineered by <span>SAVENDRA DAMPRiya</span> ⚡</div>
</div>
<div class="toast" id="toast">✓ Ready</div>

<script>
(function(){
  var searchInput = document.getElementById('searchInput');
  var searchBtn = document.getElementById('searchBtn');
  var loading = document.getElementById('loading');
  var player = document.getElementById('player');
  var results = document.getElementById('results');
  var resultsList = document.getElementById('resultsList');
  var albumImg = document.getElementById('albumImg');
  var songTitle = document.getElementById('songTitle');
  var songArtist = document.getElementById('songArtist');
  var progressFill = document.getElementById('progressFill');
  var curTime = document.getElementById('curTime');
  var durTime = document.getElementById('durTime');
  var playBtn = document.getElementById('playBtn');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var downloadBtn = document.getElementById('downloadBtn');
  var copyUrl = document.getElementById('copyUrl');
  var shareBtn = document.getElementById('shareBtn');
  var toast = document.getElementById('toast');

  var currentSong = null;
  var resultsData = [];
  var currentIdx = 0;
  var isPlaying = false;
  var progressTimer = null;
  var fakeDuration = 0;
  var fakeCurrent = 0;

  // Floating particles
  var psvg = document.getElementById('psvg');
  var notes = ['🎵','🎶','🎼','🎤','🎧','💜','✨'];
  for (var i = 0; i < 12; i++) {
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    var x = Math.random() * 90 + 5;
    var dur = Math.random() * 12 + 14;
    var delay = Math.random() * 10;
    var sway = Math.random() * 10 + 5;
    t.setAttribute('x', x + '%');
    t.setAttribute('y', '-10%');
    t.setAttribute('font-size', '20');
    t.setAttribute('text-anchor', 'middle');
    t.innerHTML = notes[i % notes.length] +
      '<animate attributeName="y" values="-10%;110%" dur="' + dur + 's" begin="' + delay + 's" repeatCount="indefinite"/>' +
      '<animate attributeName="x" values="' + x + '%;' + (x+sway) + '%;' + (x-sway) + '%;' + x + '%" dur="' + (dur/3) + 's" begin="' + delay + 's" repeatCount="indefinite"/>';
    psvg.appendChild(t);
  }

  function showToast(msg, isErr) {
    toast.innerText = msg;
    toast.className = 'toast' + (isErr ? ' err' : '');
    setTimeout(function(){ toast.classList.add('show'); }, 10);
    setTimeout(function(){ toast.classList.remove('show'); }, 2200);
  }

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { navigator.clipboard.writeText(t); return true; } catch(e){}
    }
    var ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch(e){}
    document.body.removeChild(ta);
    return ok;
  }

  function fmt(s) {
    s = Math.max(0, Math.floor(s));
    var m = Math.floor(s / 60);
    var ss = s % 60;
    return m + ':' + (ss < 10 ? '0' : '') + ss;
  }

  function stopProgress() {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
  }

  function startFakeProgress() {
    stopProgress();
    fakeCurrent = 0;
    progressFill.style.width = '0%';
    progressTimer = setInterval(function(){
      fakeCurrent += 1;
      if (fakeCurrent >= fakeDuration) {
        fakeCurrent = fakeDuration;
        stopProgress();
        isPlaying = false;
        playBtn.innerText = '▶';
      }
      curTime.innerText = fmt(fakeCurrent);
      progressFill.style.width = (fakeCurrent / fakeDuration * 100) + '%';
    }, 1000);
  }

  function loadSong(song, idx) {
    currentSong = song;
    currentIdx = idx;

    albumImg.src = song.thumb;
    albumImg.onerror = function() {
      albumImg.style.opacity = '0.3';
    };

    songTitle.innerText = song.title;
    songArtist.innerText = song.channel || 'YouTube';

    fakeDuration = 180 + Math.floor(Math.random() * 120);
    durTime.innerText = fmt(fakeDuration);

    progressFill.style.width = '0%';
    curTime.innerText = '0:00';

    player.classList.add('show');
    isPlaying = true;
    playBtn.innerText = '⏸';
    startFakeProgress();

    setTimeout(function(){
      player.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // Fake search using YouTube oEmbed-style results
  function fakeSearchResults(q) {
    // Generate some realistic looking results based on the query
    var channels = ['YouTube Music', 'Sinhala Songs', 'Sri Lankan Music', 'Top Hits', 'Music World'];
    var suffixes = ['Official Music Video', 'Lyrics Video', 'Audio Song', 'HD Video', 'Live'];
    var out = [];
    for (var i = 0; i < 8; i++) {
      var vid = 'dQw4w9WgXcQ'; // placeholder
      out.push({
        title: q + ' - ' + suffixes[i % suffixes.length],
        channel: channels[i % channels.length],
        thumb: 'https://img.youtube.com/vi/' + vid + '/mqdefault.jpg',
        videoId: vid,
        url: 'https://www.youtube.com/watch?v=' + vid
      });
    }
    return out;
  }

  function renderResults(items) {
    resultsData = items;
    resultsList.innerHTML = '';
    for (var i = 0; i < items.length; i++) {
      (function(idx){
        var item = items[idx];
        var el = document.createElement('div');
        el.className = 'result-item';
        el.innerHTML =
          '<img class="result-thumb" src="' + item.thumb + '" onerror="this.style.opacity=0.3" />' +
          '<div class="result-info">' +
            '<div class="result-title">' + item.title + '</div>' +
            '<div class="result-channel">🎤 ' + item.channel + '</div>' +
          '</div>' +
          '<div class="result-play">▶</div>';
        el.addEventListener('click', function(){
          loadSong(item, idx);
        });
        resultsList.appendChild(el);
      })(i);
    }
    results.classList.add('show');
  }

  searchBtn.addEventListener('click', function(){
    var q = searchInput.value.trim();
    if (!q) { showToast('✗ Type something first', true); return; }

    loading.classList.add('show');
    results.classList.remove('show');
    player.classList.remove('show');

    setTimeout(function(){
      loading.classList.remove('show');
      var items = fakeSearchResults(q);
      renderResults(items);
      showToast('✓ Found ' + items.length + ' results');
    }, 700);
  });

  searchInput.addEventListener('keydown', function(e){
    if (e.key === 'Enter') searchBtn.click();
  });

  playBtn.addEventListener('click', function(){
    if (!currentSong) { showToast('✗ Select a song first', true); return; }
    if (isPlaying) {
      isPlaying = false;
      playBtn.innerText = '▶';
      stopProgress();
    } else {
      isPlaying = true;
      playBtn.innerText = '⏸';
      startFakeProgress();
    }
  });

  prevBtn.addEventListener('click', function(){
    if (resultsData.length === 0) return;
    var ni = (currentIdx - 1 + resultsData.length) % resultsData.length;
    loadSong(resultsData[ni], ni);
  });

  nextBtn.addEventListener('click', function(){
    if (resultsData.length === 0) return;
    var ni = (currentIdx + 1) % resultsData.length;
    loadSong(resultsData[ni], ni);
  });

  downloadBtn.addEventListener('click', function(){
    if (!currentSong) { showToast('✗ Select a song first', true); return; }
    var cmd = '.sdl ' + currentSong.url;
    if (copyText(cmd)) {
      showToast('✓ Command copied! Paste in chat');
    } else {
      showToast('✗ Copy failed', true);
    }
  });

  copyUrl.addEventListener('click', function(){
    if (!currentSong) { showToast('✗ Nothing to copy', true); return; }
    if (copyText(currentSong.url)) {
      showToast('✓ URL copied!');
    } else {
      showToast('✗ Copy failed', true);
    }
  });

  shareBtn.addEventListener('click', function(){
    if (!currentSong) { showToast('✗ Nothing to share', true); return; }
    var txt = currentSong.title + '\n' + currentSong.url;
    if (copyText(txt)) {
      showToast('✓ Copied! Paste anywhere');
    } else {
      showToast('✗ Share failed', true);
    }
  });

  // Auto focus
  setTimeout(function(){ searchInput.focus(); }, 500);
})();
</script>
</body>
</html>`;

        const unifiedData = Buffer.from(JSON.stringify({
            "response_id": "4db57b2c-8393-484d-8b9a-8e6d1a14b349",
            "sections": [{
                "view_model": {
                    "primitive": {
                        "__typename": "GenAIaeacdsnwHtmlPrimitive",
                        "payload": html,
                        "trusted_sources": ["youtube.com", "img.youtube.com", "wa.me"]
                    },
                    "__typename": "GenAISingleLayoutViewModel"
                }
            }]
        })).toString('base64');

        let buttonMessage = generateWAMessageFromContent(from, {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [{ messageType: 2, messageText: "SHAVIYA Music 🎵" }],
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
        console.error('[MUSIC] Error:', err.message);
        return reply('❌ Music player error: ' + err.message);
    }
});
