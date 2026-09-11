const { cmd } = require('../command');
const axios = require('axios');

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
    pattern:  'web',
    alias:    ['site', 'preview', 'open'],
    desc:     'Show website preview card inside WhatsApp',
    category: 'tools',
    react:    '🌐',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const url = args[0];
        if (!url || !/^https?:\/\//i.test(url)) {
            return reply('❌ Usage: `.web https://example.com`');
        }

        await conn.sendMessage(from, {
            react: { text: '🌐', key: mek.key }
        });

        // Fetch page
        const res = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (WhatsApp Bot) AppleWebKit/537.36'
            },
            maxRedirects: 5
        });
        const html = res.data;

        // Extract metadata
        function extract(pattern) {
            const m = html.match(pattern);
            return m ? m[1].trim() : '';
        }

        const title = extract(/<title[^>]*>([^<]*)<\/title>/i)
                   || extract(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
                   || url;
        const desc = extract(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
                  || extract(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
                  || 'No description available';
        let image = extract(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                 || extract(/<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i)
                 || '';

        // Resolve relative image URL
        if (image && !/^https?:\/\//i.test(image)) {
            const base = new URL(url);
            image = new URL(image, base.origin).href;
        }

        const domain = new URL(url).hostname;

        // Build HTML preview card
        const cardHtml = `<style>
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; }
.wrapper { width: 100%; max-width: 480px; margin: auto; padding: 12px; }
.card { background: linear-gradient(180deg, rgba(15,18,26,0.98), rgba(10,12,18,0.98)); border: 2px solid #3b82f6; border-radius: 18px; overflow: hidden; box-shadow: 0 14px 44px rgba(0,0,0,0.75), inset 0 0 40px rgba(59,130,246,0.06); }
.browser-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.06); }
.dots { display: flex; gap: 5px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.d-red { background: #ef4444; }
.d-yellow { background: #f59e0b; }
.d-green { background: #10b981; }
.url-bar { flex: 1; background: rgba(255,255,255,0.06); border-radius: 8px; padding: 5px 10px; font-size: 10px; color: #94a3b8; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: 600; }
.hero { width: 100%; height: 140px; background: linear-gradient(135deg, #1e293b, #0f172a); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.hero img { width: 100%; height: 100%; object-fit: cover; }
.hero-fallback { font-size: 50px; opacity: 0.4; }
.content { padding: 14px; }
.domain { font-size: 9px; letter-spacing: 1.5px; color: #3b82f6; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; }
.title { font-size: 15px; font-weight: 900; color: #fff; line-height: 1.3; margin-bottom: 8px; }
.desc { font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 12px; }
.btn { display: block; width: 100%; padding: 12px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-align: center; cursor: pointer; text-decoration: none; }
.credit-bar { text-align: center; font-size: 9px; font-weight: 700; letter-spacing: 1.2px; color: #64748b; text-transform: uppercase; padding: 10px; border-top: 1px dashed rgba(255,255,255,0.1); }
.credit-bar span { color: #3b82f6; font-weight: 900; text-shadow: 0 0 8px rgba(59,130,246,0.5); }
</style>
<body>
<div class="wrapper">
  <div class="card">
    <div class="browser-bar">
      <div class="dots">
        <div class="dot d-red"></div>
        <div class="dot d-yellow"></div>
        <div class="dot d-green"></div>
      </div>
      <div class="url-bar">🔒 ${domain}</div>
    </div>
    <div class="hero">
      ${image ? '<img src="' + image + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" /><div class="hero-fallback" style="display:none">🌐</div>' : '<div class="hero-fallback">🌐</div>'}
    </div>
    <div class="content">
      <div class="domain">${domain}</div>
      <div class="title">${title}</div>
      <div class="desc">${desc}</div>
      <a class="btn" href="${url}" target="_blank">🌐 Open Website</a>
    </div>
    <div class="credit-bar">Preview by <span>Savendra Dampriya</span></div>
  </div>
</div>
</body>
</html>`;

        const unifiedData = Buffer.from(JSON.stringify({
            "response_id": "4db57b2c-8393-484d-8b9a-8e6d1a14b349",
            "sections": [
                {
                    "view_model": {
                        "primitive": {
                            "__typename": "GenAIaeacdsnwHtmlPrimitive",
                            "payload": cardHtml,
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
                        submessages: [{ messageType: 2, messageText: "🌐 Website Preview" }],
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
        console.error('Web Preview Error:', err);
        return reply('❌ Failed to load preview: ' + err.message);
    }
});
