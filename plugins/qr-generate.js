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
    pattern: 'qr',
    alias: ['qrcode', 'qrgen', 'makeqr'],
    desc: 'Generate beautiful QR codes with custom logo',
    category: 'tools',
    react: '📷',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '📷', key: mek.key }
        });

        // Escape initial text
        const initialText = (args.join(' ') || '').trim()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const gameHtml = `<style>
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: #0a0f1e; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; color: #fff; min-height: 100vh; overflow-x: hidden; }
.bg { position: fixed; inset: 0; z-index: -1; background: radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18) 0, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.18) 0, transparent 50%), radial-gradient(circle at 50% 50%, rgba(16,185,129,0.08) 0, transparent 60%); }
.wrap { max-width: 480px; margin: auto; padding: 12px; }
.header { text-align: center; padding: 14px; background: linear-gradient(180deg, rgba(15,18,26,0.97), rgba(10,12,18,0.97)); border: 2px solid #1e293b; border-radius: 14px; margin-bottom: 12px; }
.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: pulse 1.4s infinite; margin-right: 6px; vertical-align: middle; }
@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
.header h1 { font-size: 16px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
.header h1 span { color: #3b82f6; text-shadow: 0 0 12px rgba(59,130,246,0.6); }
.header p { font-size: 10px; color: #94a3b8; margin-top: 4px; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; }

.card { background: rgba(15,18,26,0.97); border: 2px solid #1e293b; border-radius: 14px; padding: 14px; margin-bottom: 10px; }
.lbl { display: block; font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; margin-bottom: 8px; }
textarea { width: 100%; padding: 11px 12px; background: rgba(0,0,0,0.4); border: 2px solid #1e293b; border-radius: 10px; color: #fff; font-size: 14px; font-family: inherit; resize: none; min-height: 60px; outline: none; transition: border-color 0.2s; line-height: 1.4; }
textarea:focus { border-color: #3b82f6; }
textarea::placeholder { color: #475569; }

.colors { display: flex; gap: 8px; flex-wrap: wrap; }
.color-chip { width: 34px; height: 34px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: transform 0.15s, border-color 0.2s; position: relative; }
.color-chip.on { border-color: #fff; transform: scale(1.12); box-shadow: 0 0 12px currentColor; }
.color-chip:active { transform: scale(0.9); }
.color-chip.on::after { content: '✓'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 14px; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }

.logo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.logo-opt { padding: 10px 4px; background: rgba(0,0,0,0.4); border: 2px solid #1e293b; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.15s; font-size: 22px; line-height: 1; }
.logo-opt.on { border-color: #3b82f6; background: rgba(59,130,246,0.18); transform: scale(1.05); }
.logo-opt:active { transform: scale(0.92); }

.size-row { display: flex; gap: 6px; }
.size-pill { flex: 1; padding: 10px 6px; background: rgba(0,0,0,0.4); border: 2px solid #1e293b; border-radius: 10px; text-align: center; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.15s; color: #94a3b8; letter-spacing: 0.5px; }
.size-pill.on { border-color: #3b82f6; color: #93c5fd; background: rgba(59,130,246,0.15); }
.size-pill:active { transform: scale(0.95); }

.btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 14px; font-weight: 900; letter-spacing: 1.2px; text-transform: uppercase; color: #fff; cursor: pointer; transition: all 0.15s; background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 16px rgba(59,130,246,0.45); margin-top: 4px; }
.btn:active { transform: scale(0.97); filter: brightness(0.9); }
.btn-g { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px rgba(16,185,129,0.45); }
.btn-ghost { background: rgba(255,255,255,0.06); border: 2px solid #1e293b; box-shadow: none; }

.qr-stage { display: none; justify-content: center; padding: 20px 0 14px; }
.qr-stage.show { display: flex; }
.qr-wrap { position: relative; padding: 18px; background: #fff; border-radius: 20px; box-shadow: 0 14px 44px rgba(0,0,0,0.7), 0 0 60px rgba(59,130,246,0.25); animation: pop 0.45s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes pop { 0% { transform: scale(0.4) rotate(-8deg); opacity: 0; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
#qrImg { display: block; width: 260px; height: 260px; image-rendering: pixelated; image-rendering: crisp-edges; }
.qr-logo { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 62px; height: 62px; background: #fff; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 36px; line-height: 1; box-shadow: 0 3px 14px rgba(0,0,0,0.2); padding: 6px; z-index: 2; }
.qr-logo::before { content: ''; position: absolute; inset: -4px; background: #fff; border-radius: 18px; z-index: -1; }

.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.actions .btn { margin-top: 0; }

.loading { display: none; text-align: center; padding: 30px; }
.loading.show { display: block; }
.spinner { display: inline-block; width: 34px; height: 34px; border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }
.loading p { font-size: 11px; color: #94a3b8; margin-top: 10px; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; }

.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(120px); background: #10b981; color: #fff; padding: 11px 22px; border-radius: 12px; font-size: 12px; font-weight: 800; letter-spacing: 1px; transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1); z-index: 9999; box-shadow: 0 8px 30px rgba(16,185,129,0.5); white-space: nowrap; }
.toast.show { transform: translateX(-50%) translateY(0); }
.toast.err { background: #ef4444; box-shadow: 0 8px 30px rgba(239,68,68,0.5); }

.credit { text-align: center; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; color: #64748b; text-transform: uppercase; padding: 14px 0 6px; }
.credit span { color: #3b82f6; text-shadow: 0 0 10px rgba(59,130,246,0.5); }
</style>

<body>
<div class="bg"></div>
<div class="wrap">
  <div class="header">
    <h1><span class="dot"></span><span>SHAVIYA-XMD QR</span></h1>
    <p>Beautiful QR Code Generator</p>
  </div>

  <div class="card">
    <label class="lbl">📝 Text or URL</label>
    <textarea id="txt" placeholder="https://example.com or type anything...">${initialText}</textarea>
  </div>

  <div class="card">
    <label class="lbl">🎨 QR Color</label>
    <div class="colors" id="colors">
      <div class="color-chip on" data-color="000000" style="background:#000;color:#000"></div>
      <div class="color-chip" data-color="3b82f6" style="background:#3b82f6;color:#3b82f6"></div>
      <div class="color-chip" data-color="10b981" style="background:#10b981;color:#10b981"></div>
      <div class="color-chip" data-color="ef4444" style="background:#ef4444;color:#ef4444"></div>
      <div class="color-chip" data-color="a855f7" style="background:#a855f7;color:#a855f7"></div>
      <div class="color-chip" data-color="f59e0b" style="background:#f59e0b;color:#f59e0b"></div>
    </div>
  </div>

  <div class="card">
    <label class="lbl">👑 Center Logo</label>
    <div class="logo-grid" id="logos">
      <div class="logo-opt on" data-logo="👑">👑</div>
      <div class="logo-opt" data-logo="⭐">⭐</div>
      <div class="logo-opt" data-logo="💎">💎</div>
      <div class="logo-opt" data-logo="❤️">❤️</div>
      <div class="logo-opt" data-logo="🎮">🎮</div>
    </div>
  </div>

  <div class="card">
    <label class="lbl">📏 Size</label>
    <div class="size-row" id="sizes">
      <div class="size-pill" data-size="320">S</div>
      <div class="size-pill on" data-size="420">M</div>
      <div class="size-pill" data-size="520">L</div>
    </div>
  </div>

  <button class="btn" id="gen">✨ Generate QR Code</button>

  <div class="loading" id="load">
    <div class="spinner"></div>
    <p>Generating...</p>
  </div>

  <div class="qr-stage" id="stage">
    <div class="qr-wrap">
      <img id="qrImg" src="" alt="QR Code">
      <div class="qr-logo" id="qrLogo">👑</div>
    </div>
  </div>

  <div class="actions" id="acts" style="display:none">
    <button class="btn btn-g" id="copyBtn">🔗 Copy URL</button>
    <button class="btn btn-ghost" id="resetBtn">🔄 Reset</button>
  </div>

  <div class="credit">Engineered by <span>SAVENDRA DAMPRiya</span> ⚡</div>
</div>
<div class="toast" id="toast">✓ Done!</div>

<script>
(function(){
  var txt = document.getElementById('txt');
  var genBtn = document.getElementById('gen');
  var qrImg = document.getElementById('qrImg');
  var qrLogo = document.getElementById('qrLogo');
  var stage = document.getElementById('stage');
  var acts = document.getElementById('acts');
  var load = document.getElementById('load');
  var toast = document.getElementById('toast');

  var currentColor = '000000';
  var currentLogo = '👑';
  var currentSize = 420;
  var currentQrUrl = '';

  function showToast(msg, isErr) {
    toast.innerText = msg;
    toast.className = 'toast' + (isErr ? ' err' : '');
    setTimeout(function(){ toast.classList.add('show'); }, 10);
    setTimeout(function(){ toast.classList.remove('show'); }, 1800);
  }

  // Color
  document.getElementById('colors').addEventListener('click', function(e){
    var c = e.target.closest('.color-chip');
    if (!c) return;
    document.querySelectorAll('.color-chip').forEach(function(x){ x.classList.remove('on'); });
    c.classList.add('on');
    currentColor = c.getAttribute('data-color');
  });

  // Logo
  document.getElementById('logos').addEventListener('click', function(e){
    var l = e.target.closest('.logo-opt');
    if (!l) return;
    document.querySelectorAll('.logo-opt').forEach(function(x){ x.classList.remove('on'); });
    l.classList.add('on');
    currentLogo = l.getAttribute('data-logo');
  });

  // Size
  document.getElementById('sizes').addEventListener('click', function(e){
    var s = e.target.closest('.size-pill');
    if (!s) return;
    document.querySelectorAll('.size-pill').forEach(function(x){ x.classList.remove('on'); });
    s.classList.add('on');
    currentSize = parseInt(s.getAttribute('data-size'), 10);
  });

  // Generate
  genBtn.addEventListener('click', function(){
    var text = txt.value.trim();
    if (!text) { showToast('✗ Enter text first', true); return; }

    // Build QR URL (high error correction for logo overlay)
    var url = 'https://api.qrserver.com/v1/create-qr-code/'
            + '?size=' + currentSize + 'x' + currentSize
            + '&data=' + encodeURIComponent(text)
            + '&ecc=H'
            + '&color=' + currentColor
            + '&bgcolor=ffffff'
            + '&margin=2'
            + '&format=png';

    currentQrUrl = url;

    load.classList.add('show');
    stage.classList.remove('show');
    acts.style.display = 'none';

    qrImg.onload = function(){
      load.classList.remove('show');
      qrLogo.innerText = currentLogo;
      stage.classList.add('show');
      acts.style.display = 'grid';
      showToast('✓ QR Generated!');
    };
    qrImg.onerror = function(){
      load.classList.remove('show');
      showToast('✗ Generation failed', true);
    };
    qrImg.src = url;
  });

  // Copy URL
  document.getElementById('copyBtn').addEventListener('click', function(){
    if (!currentQrUrl) return;
    var done = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        navigator.clipboard.writeText(currentQrUrl);
        done = true;
      } catch(e){}
    }
    if (!done) {
      var ta = document.createElement('textarea');
      ta.value = currentQrUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch(e){}
      document.body.removeChild(ta);
    }
    showToast('✓ URL Copied!');
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', function(){
    txt.value = '';
    currentQrUrl = '';
    stage.classList.remove('show');
    acts.style.display = 'none';
    showToast('🔄 Reset');
  });

  // Auto-generate if initial text exists
  if (txt.value.trim()) {
    setTimeout(function(){ genBtn.click(); }, 500);
  }
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
                                "api.qrserver.com",
                                "wa.me",
                                "whatsapp.com"
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
                        submessages: [{ messageType: 2, messageText: "QR Code Generator 📷" }],
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
        console.error('QR Send Error:', err);
        return reply('❌ QR generator error');
    }
});
