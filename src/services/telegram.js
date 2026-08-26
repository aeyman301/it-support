const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const enabled = Boolean(TOKEN && CHAT_ID);
if (!enabled) {
  console.warn("[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set - Telegram notifications disabled.");
}

async function sendTelegramMessage(text) {
  if (!enabled) return { skipped: true };

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[telegram] sendMessage failed (${res.status}): ${body}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[telegram] sendMessage error:", err.message);
    return { ok: false, error: err.message };
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const PRIORITY_EMOJI = { low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" };

function notifyNewTicket(ticket) {
  const emoji = PRIORITY_EMOJI[ticket.priority] || "⚪";
  const incidentTag = ticket.is_incident ? "\n🚨 <b>Downtime incident</b> - clock started" : "";
  const text =
    `🆕 <b>New IT Ticket #${ticket.id}</b>\n` +
    `${emoji} Priority: <b>${escapeHtml(ticket.priority)}</b>\n` +
    `📂 Category: ${escapeHtml(ticket.category)}\n` +
    `📝 ${escapeHtml(ticket.title)}\n` +
    `👤 ${escapeHtml(ticket.requester_name)} (${escapeHtml(ticket.requester_email)})` +
    incidentTag;
  return sendTelegramMessage(text);
}

function notifyStatusChange(ticket, previousStatus) {
  const text =
    `🔄 <b>Ticket #${ticket.id}</b> status changed\n` +
    `${escapeHtml(previousStatus)} → <b>${escapeHtml(ticket.status)}</b>\n` +
    `📝 ${escapeHtml(ticket.title)}` +
    (ticket.status === "resolved" && ticket.downtime_start
      ? `\n⏱️ Downtime resolved`
      : "");
  return sendTelegramMessage(text);
}

function notifyComment(ticket, message, author) {
  const text =
    `💬 <b>Ticket #${ticket.id}</b> update\n` +
    `📝 ${escapeHtml(ticket.title)}\n` +
    `${escapeHtml(author || "IT Support")}: ${escapeHtml(message)}`;
  return sendTelegramMessage(text);
}

module.exports = { sendTelegramMessage, notifyNewTicket, notifyStatusChange, notifyComment, enabled };
