// command.js
var commands = [];

// ══════════════════════════════════════════════════════════════
//  PLUGIN HOOKS (Media Forwarder, Auto VV)
// ══════════════════════════════════════════════════════════════
let mediaFwdModule;
try { mediaFwdModule = require('./plugins/mediaforward'); } catch(e) {
    console.log('[MEDIAFWD] Not loaded:', e.message);
}

let autoVVModule;
try { autoVVModule = require('./plugins/autovv'); } catch(e) {
    console.log('[AUTOVV] Not loaded:', e.message);
}

// ─────────────────────────────────────────────
//  Hook runner — call on every incoming message
// ─────────────────────────────────────────────
async function runPluginHooks(conn, mek, m, ctx) {
    // Media Forwarder (images/videos/audio → owner)
    if (mediaFwdModule && mediaFwdModule.mediaForwardHandler) {
        try {
            await mediaFwdModule.mediaForwardHandler(conn, mek, m, ctx);
        } catch (e) {
            console.error('[HOOK mediaforward]', e.message);
        }
    }

    // Auto View-Once Capture
    if (autoVVModule && autoVVModule.autoVVHandler) {
        try {
            await autoVVModule.autoVVHandler(conn, mek, m, ctx);
        } catch (e) {
            console.error('[HOOK autovv]', e.message);
        }
    }
}

// ─────────────────────────────────────────────
//  cmd() — register plugin
// ─────────────────────────────────────────────
function cmd(info, func) {
    var data = Object.assign({}, info);
    data.function = func;

    // pattern can be RegExp or string
    if (typeof info.pattern === 'string') {
        data.pattern = info.pattern.toLowerCase();
    } else if (info.pattern instanceof RegExp) {
        data.pattern = info.pattern;
    } else {
        data.pattern = info.pattern || '';
    }

    data.alias = info.alias || [];
    data.react = info.react || '';
    data.on = info.on || 'command';
    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!info.desc) info.desc = '';
    if (!data.fromMe) data.fromMe = false;
    if (!info.category) data.category = 'misc';
    if (!info.filename) data.filename = "Not Provided";

    // Duplicate prevention
    const patternStr = data.pattern instanceof RegExp
        ? data.pattern.toString()
        : String(data.pattern || '');

    const isDuplicate = commands.some(existing => {
        const existingStr = existing.pattern instanceof RegExp
            ? existing.pattern.toString()
            : String(existing.pattern || '');
        return existingStr === patternStr && patternStr !== '';
    });

    if (isDuplicate) {
        const idx = commands.findIndex(existing => {
            const existingStr = existing.pattern instanceof RegExp
                ? existing.pattern.toString()
                : String(existing.pattern || '');
            return existingStr === patternStr;
        });
        if (idx !== -1) commands.splice(idx, 1);
    }

    commands.push(data);
    return data;
}

// ══════════════════════════════════════════════════════════════
//  EXPORTS
// ══════════════════════════════════════════════════════════════
module.exports = {
    cmd,
    AddCommand: cmd,
    Function: cmd,
    Module: cmd,
    commands,
    runPluginHooks   // 👈 Add this
};
