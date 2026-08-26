const nodemailer = require("nodemailer");

const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_DOCUMENTATION_TO } = process.env;

const enabled = Boolean(SMTP_HOST && EMAIL_FROM && EMAIL_DOCUMENTATION_TO);

let transporter = null;
if (enabled) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === "true",
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
} else {
  console.warn("[email] SMTP_HOST / EMAIL_FROM / EMAIL_DOCUMENTATION_TO not fully set - email documentation disabled.");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

async function sendMail({ subject, html, to }) {
  if (!enabled) return { skipped: true };
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: to || EMAIL_DOCUMENTATION_TO,
      subject,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] sendMail error:", err.message);
    return { ok: false, error: err.message };
  }
}

function ticketDetailsHtml(ticket) {
  return `
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:4px 8px;color:#666">Ticket ID</td><td style="padding:4px 8px"><b>#${ticket.id}</b></td></tr>
      <tr><td style="padding:4px 8px;color:#666">Title</td><td style="padding:4px 8px">${escapeHtml(ticket.title)}</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Description</td><td style="padding:4px 8px">${escapeHtml(ticket.description).replace(/\n/g, "<br>")}</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Requester</td><td style="padding:4px 8px">${escapeHtml(ticket.requester_name)} (${escapeHtml(ticket.requester_email)})</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Category</td><td style="padding:4px 8px">${escapeHtml(ticket.category)}</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Priority</td><td style="padding:4px 8px">${escapeHtml(ticket.priority)}</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Status</td><td style="padding:4px 8px">${escapeHtml(ticket.status)}</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Incident / downtime</td><td style="padding:4px 8px">${ticket.is_incident ? "Yes" : "No"}</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Created</td><td style="padding:4px 8px">${ticket.created_at}</td></tr>
    </table>
  `;
}

function notifyNewTicket(ticket) {
  return sendMail({
    subject: `[IT Ticket #${ticket.id}] ${ticket.title}`,
    html: `<h2>New IT support ticket opened</h2>${ticketDetailsHtml(ticket)}`,
  });
}

function notifyStatusChange(ticket, previousStatus) {
  let downtimeLine = "";
  if (ticket.is_incident && ticket.downtime_start) {
    const start = new Date(ticket.downtime_start);
    const end = ticket.downtime_end ? new Date(ticket.downtime_end) : new Date();
    downtimeLine = `<p><b>Downtime duration:</b> ${formatDuration(end - start)} (started ${ticket.downtime_start}${ticket.downtime_end ? `, ended ${ticket.downtime_end}` : ", ongoing"})</p>`;
  }
  return sendMail({
    subject: `[IT Ticket #${ticket.id}] Status changed: ${previousStatus} -> ${ticket.status}`,
    html: `<h2>Ticket #${ticket.id} status updated</h2><p>${escapeHtml(previousStatus)} &rarr; <b>${escapeHtml(ticket.status)}</b></p>${downtimeLine}${ticketDetailsHtml(ticket)}`,
  });
}

module.exports = { sendMail, notifyNewTicket, notifyStatusChange, formatDuration, enabled };
