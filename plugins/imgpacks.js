// ============================================================
//  imgpack.js — SHAVIYA-XMD
//  Image Pack Manager (links save karala, quality drop nathuwa
//  DOCUMENT widihata send karanawa)
//
//  .addimg [pack name] [image link] [link2] [link3]...
//  .imgpack [pack name]
//  .imgpacks
//  .delimg [pack name]            -> pack eka mulinma delete
//  .delimg [pack name] [number]   -> pack eke image ekak delete
// ============================================================

const { cmd } = require('../command');
const axios   = require('axios');
const fs      = require('fs');
const path    = require('path');

// ── Storage ────────────────────────────────────────────────
const DATA_DIR  = path.join(__dirname, '../shaviya_data');
const DATA_FILE = path.join(DATA_DIR, 'imgpacks.json');

// Yawana images athara delay (ms) - WhatsApp spam/ban nathi wenna
const SEND_DELAY = 1200;
// Ekak download karanna puluwan max size (MB)
const MAX_SIZE_MB = 60;

function loadDB() {
    try {
        if (!fs.existsSync(DATA_FILE)) return {};
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const db = JSON.parse(raw || '{}');
        return (db && typeof db === 'object') ? db : {};
    } catch (e) {
        console.error('[IMGPACK] DB read error:', e.message);
        return {};
    }
}

function saveDB(db) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        // atomic-ish write: temp file ekakata liyala rename karanawa
        const tmp = DATA_FILE + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
        fs.renameSync(tmp, DATA_FILE);
        return true;
    } catch (e) {
        console.error('[IMGPACK] DB write error:', e.message);
        return false;
    }
}

const normName = (s) => String(s || '').trim().toLowerCase();
const isUrl    = (s) => /^https?:\/\/\S+$/i.test(s);
const sleep    = (ms) => new Promise(r => setTimeout(r, ms));

// ── Helpers ────────────────────────────────────────────────
const EXT_BY_MIME = {
    'image/jpeg': 'jpg',
    'image/jpg':  'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'image/gif':  'gif',
    'image/bmp':  'bmp',
    'image/avif': 'avif',
    'image/heic': 'heic',
    'image/tiff': 'tiff'
};

// Buffer eke magic bytes balala real image type eka hoyanawa
function sniffImage(buf) {
    if (!buf || buf.length < 12) return null;
    const hex = buf.slice(0, 12).toString('hex');
    if (hex.startsWith('ffd8ff'))                         return { mime: 'image/jpeg', ext: 'jpg' };
    if (hex.startsWith('89504e470d0a1a0a'))               return { mime: 'image/png',  ext: 'png' };
    if (hex.startsWith('47494638'))                       return { mime: 'image/gif',  ext: 'gif' };
    if (hex.startsWith('424d'))                           return { mime: 'image/bmp',  ext: 'bmp' };
    if (buf.slice(0, 4).toString() === 'RIFF' &&
        buf.slice(8, 12).toString() === 'WEBP')           return { mime: 'image/webp', ext: 'webp' };
    if (buf.slice(4, 12).toString() === 'ftypavif')       return { mime: 'image/avif', ext: 'avif' };
    if (['ftypheic', 'ftypheix', 'ftypmif1'].includes(buf.slice(4, 12).toString()))
                                                          return { mime: 'image/heic', ext: 'heic' };
    return null;
}

// Link eka ekata download karala (original bytes, kisima compress ekak nathuwa)
async function downloadImage(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: MAX_SIZE_MB * 1024 * 1024,
        maxBodyLength:    MAX_SIZE_MB * 1024 * 1024,
        maxRedirects: 5,
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Safari/537.36' }
    });

    const buffer = Buffer.from(res.data);
    let info = sniffImage(buffer);

    if (!info) {
        // magic bytes wadak nane nam content-type eka balamu
        const ct = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
        if (EXT_BY_MIME[ct]) info = { mime: ct, ext: EXT_BY_MIME[ct] };
    }
    if (!info) throw new Error('Link eka image ekak nemei');

    return { buffer, ...info };
}

// ============================================================
//  .addimg [pack] [link] [link2...]
// ============================================================
cmd({
    pattern:  'addimg',
    alias:    ['addimgpack', 'imgadd'],
    desc:     'Image pack ekakata image link save karanna',
    category: 'tools',
    react:    '➕',
    filename: __filename
},
async (conn, mek, m, { from, args, isOwner, reply }) => {
    try {
        if (!isOwner) return reply('❌ Me command eka use karanna puluwan owner ta witharai.');

        if (!args || args.length < 2) {
            return reply(
`*📦 ADD IMAGE TO PACK*

Use karana widiha:
.addimg [pack name] [image link]

Example:
.addimg cars https://example.com/car1.jpg

_Links godak ekata danna puluwan:_
.addimg cars link1 link2 link3`
            );
        }

        const pack  = normName(args[0]);
        const links = args.slice(1).filter(isUrl);

        if (!/^[a-z0-9_\-]{1,30}$/i.test(pack)) {
            return reply('⚠️ Pack name eka letters, numbers, _ , - witharai (max 30). Space ekak danna epa.');
        }
        if (!links.length) {
            return reply('⚠️ Valid image link ekak (http/https) denna.');
        }

        const db = loadDB();
        if (!Array.isArray(db[pack])) db[pack] = [];

        let added = 0, dupes = 0;
        for (const link of links) {
            if (db[pack].includes(link)) { dupes++; continue; }
            db[pack].push(link);
            added++;
        }

        if (!saveDB(db)) return reply('❌ Save karanna bari una. Ayeth try karanna.');

        let msg = `✅ *${pack}* pack ekata image ${added}ak add una.\n📁 Total images: *${db[pack].length}*`;
        if (dupes) msg += `\n⚠️ Already thibba links ${dupes}ak skip una.`;
        msg += `\n\n_Pack eka ganna:_ .imgpack ${pack}`;
        reply(msg);
    } catch (e) {
        console.error('[ADDIMG ERROR]', e);
        reply('⚠️ Error: ' + e.message);
    }
});

// ============================================================
//  .imgpack [pack]   -> images tika DOCUMENT widihata send
// ============================================================
cmd({
    pattern:  'imgpack',
    alias:    ['pack', 'getpack'],
    desc:     'Pack eke images tika original quality ekata (document) ganna',
    category: 'tools',
    react:    '📦',
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const db = loadDB();

        // Name ekak nathnam pack list eka pennanawa
        if (!args || !args[0]) {
            const names = Object.keys(db);
            if (!names.length) return reply('📭 Thama pack ekak hadala nathi. .addimg [pack] [link] use karanna.');
            let txt = '*📦 IMAGE PACKS*\n\n';
            names.forEach((n, i) => { txt += `${i + 1}. *${n}* — ${db[n].length} images\n`; });
            txt += '\n_Ganna:_ .imgpack [pack name]';
            return reply(txt);
        }

        const pack   = normName(args[0]);
        const images = db[pack];

        if (!Array.isArray(images) || !images.length) {
            return reply(`❌ *${pack}* kiyala pack ekak nathi.\n\n.imgpacks kiyala type karala list eka balanna.`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        await reply(`📦 *${pack}* — images ${images.length}ak document widihata yawanawa...\n_Poddak inna._`);

        let ok = 0;
        const failed = [];

        for (let i = 0; i < images.length; i++) {
            const url = images[i];
            try {
                const img = await downloadImage(url);
                await conn.sendMessage(from, {
                    document: img.buffer,          // original bytes -> no quality loss
                    mimetype: img.mime,
                    fileName: `${pack}_${String(i + 1).padStart(2, '0')}.${img.ext}`,
                    caption:  `📦 ${pack} (${i + 1}/${images.length})`
                }, { quoted: mek });
                ok++;
            } catch (err) {
                console.error(`[IMGPACK] #${i + 1} failed:`, err.message);
                failed.push(i + 1);
            }
            if (i < images.length - 1) await sleep(SEND_DELAY);
        }

        await conn.sendMessage(from, { react: { text: ok ? '✅' : '❌', key: mek.key } });

        let summary = `✅ Sent: *${ok}/${images.length}*`;
        if (failed.length) {
            summary += `\n⚠️ Fail una images: ${failed.join(', ')}` +
                       `\n_(Link eka expire wela ho image ekak nemei wenna puluwan. .delimg ${pack} [number] walin ain karanna.)_`;
        }
        reply(summary);
    } catch (e) {
        console.error('[IMGPACK ERROR]', e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } }).catch(() => {});
        reply('⚠️ Error: ' + e.message);
    }
});

// ============================================================
//  .imgpacks   -> list
// ============================================================
cmd({
    pattern:  'imgpacks',
    alias:    ['packlist', 'listpacks'],
    desc:     'Hadala thiyena image packs list eka',
    category: 'tools',
    react:    '📚',
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    try {
        const db = loadDB();
        const names = Object.keys(db);
        if (!names.length) return reply('📭 Thama pack ekak hadala nathi. .addimg [pack] [link] use karanna.');
        let txt = '*📚 IMAGE PACKS*\n\n';
        names.forEach((n, i) => { txt += `${i + 1}. *${n}* — ${db[n].length} images\n`; });
        txt += '\n_Ganna:_ .imgpack [pack name]';
        reply(txt);
    } catch (e) {
        reply('⚠️ Error: ' + e.message);
    }
});

// ============================================================
//  .delimg [pack]  |  .delimg [pack] [number]
// ============================================================
cmd({
    pattern:  'delimg',
    alias:    ['delpack', 'removeimg'],
    desc:     'Pack ekak ho pack eke image ekak delete karanna',
    category: 'tools',
    react:    '🗑️',
    filename: __filename
},
async (conn, mek, m, { args, isOwner, reply }) => {
    try {
        if (!isOwner) return reply('❌ Me command eka use karanna puluwan owner ta witharai.');
        if (!args || !args[0]) {
            return reply('Use karana widiha:\n.delimg [pack]  (pack eka mulinma)\n.delimg [pack] [number]  (image ekak)');
        }

        const pack = normName(args[0]);
        const db   = loadDB();
        if (!Array.isArray(db[pack])) return reply(`❌ *${pack}* kiyala pack ekak nathi.`);

        // image ekak witharak delete
        if (args[1]) {
            const n = parseInt(args[1], 10);
            if (!n || n < 1 || n > db[pack].length) {
                return reply(`⚠️ Number eka 1 - ${db[pack].length} athara wenna ona.`);
            }
            db[pack].splice(n - 1, 1);
            if (!db[pack].length) delete db[pack];
            saveDB(db);
            return reply(`🗑️ *${pack}* pack eken image #${n} delete una.`);
        }

        // pack eka mulinma delete
        delete db[pack];
        saveDB(db);
        reply(`🗑️ *${pack}* pack eka delete una.`);
    } catch (e) {
        reply('⚠️ Error: ' + e.message);
    }
});
