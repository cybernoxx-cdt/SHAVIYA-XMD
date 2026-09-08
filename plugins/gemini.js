const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

/**
 * Converts standard Markdown (which Gemini often returns) into
 * WhatsApp-friendly formatting.
 *  **bold**      -> *bold*
 *  __bold__      -> *bold*
 *  _italic_      -> _italic_        (already valid on WhatsApp)
 *  ~~strike~~    -> ~strike~
 *  ### Heading   -> *Heading*
 *  ```code```    -> ```code```      (kept as-is, WhatsApp supports it)
 *  * bullet      -> • bullet
 */
function formatForWhatsapp(text) {
    if (!text || typeof text !== "string") return "";

    let out = text;

    // Headings (###, ##, #) -> bold line
    out = out.replace(/^#{1,6}\s?(.*)$/gm, "*$1*");

    // Bold: **text** or __text__  -> *text*
    out = out.replace(/\*\*(.+?)\*\*/g, "*$1*");
    out = out.replace(/__(.+?)__/g, "*$1*");

    // Strikethrough: ~~text~~ -> ~text~
    out = out.replace(/~~(.+?)~~/g, "~$1~");

    // Bullet points: "* item" or "- item" -> "• item"
    out = out.replace(/^[*-]\s+/gm, "• ");

    // Collapse 3+ blank lines down to 2
    out = out.replace(/\n{3,}/g, "\n\n");

    return out.trim();
}

cmd({
    pattern: "gemini",
    alias: ["gpt", "ai", "bard"],
    use: ".gemini <your question>",
    react: "🤖",
    desc: "Chat with Gemini AI.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {

    try {
        if (!q || !q.trim()) {
            return await reply(
                "*Gemini AI*\n\n" +
                "Please enter a question or message.\n\n" +
                "Example: `.gemini What is the capital of Sri Lanka?`"
            );
        }

        const apiKey = "zan_vWpU1lkr_g6wwxdlvyv";
        const apiUrl = `https://api.zanta-mini.store/api/gemini?apiKey=${apiKey}&text=${encodeURIComponent(q.trim())}`;

        let response;
        try {
            response = await fetchJson(apiUrl);
        } catch (netErr) {
            console.log("Gemini API network error:", netErr);
            return await reply("*Gemini AI*\n\nCouldn't reach the server right now. Please try again in a moment.");
        }

        if (!response || response.success !== true || !response.result) {
            return await reply("*Gemini AI*\n\nNo response received. Please rephrase your question and try again.");
        }

        const formattedAnswer = formatForWhatsapp(response.result);

        if (!formattedAnswer) {
            return await reply("*Gemini AI*\n\nGot an empty reply. Please try again.");
        }

        await reply(formattedAnswer);

    } catch (err) {
        console.log("Gemini plugin error:", err);
        await reply("*Gemini AI*\n\nSomething went wrong while processing your request. Please try again.");
    }
});
