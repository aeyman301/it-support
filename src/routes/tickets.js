const express = require("express");
const db = require("../db");
const telegram = require("../services/telegram");
const email = require("../services/email");

const router = express.Router();

const STATUSES = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "medium", "high", "critical"];

function nowIso() {
  return new Date().toISOString();
}

function requireAdmin(req, res, next) {
  const token = req.get("x-admin-token");
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || token !== expected) {
    return res.status(401).json({ error: "Invalid or missing admin token" });
  }
  next();
}

function serializeTicket(row) {
  if (!row) return row;
  return { ...row, is_incident: Boolean(row.is_incident) };
}

function getTicket(id) {
  const row = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  return serializeTicket(row);
}

function addEvent(ticketId, type, message, author) {
  db.prepare(
    "INSERT INTO ticket_events (ticket_id, type, message, author, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(ticketId, type, message, author || null, nowIso());
}

// List tickets (optionally filter by status)
router.get("/", (req, res) => {
  const { status } = req.query;
  let rows;
  if (status && STATUSES.includes(status)) {
    rows = db.prepare("SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC").all(status);
  } else {
    rows = db.prepare("SELECT * FROM tickets ORDER BY created_at DESC").all();
  }
  res.json(rows.map(serializeTicket));
});

// Create ticket
router.post("/", (req, res) => {
  const { title, description, requester_name, requester_email, category, priority, is_incident } = req.body || {};

  if (!title || !description || !requester_name || !requester_email) {
    return res.status(400).json({ error: "title, description, requester_name and requester_email are required" });
  }
  const finalPriority = PRIORITIES.includes(priority) ? priority : "medium";
  const finalCategory = (category && String(category).trim()) || "other";
  const incident = Boolean(is_incident);
  const timestamp = nowIso();

  const result = db
    .prepare(
      `INSERT INTO tickets
        (title, description, requester_name, requester_email, category, priority, status, is_incident, downtime_start, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)`
    )
    .run(
      String(title).trim(),
      String(description).trim(),
      String(requester_name).trim(),
      String(requester_email).trim(),
      finalCategory,
      finalPriority,
      incident ? 1 : 0,
      incident ? timestamp : null,
      timestamp,
      timestamp
    );

  const ticket = getTicket(result.lastInsertRowid);
  addEvent(ticket.id, "created", "Ticket created", ticket.requester_name);

  telegram.notifyNewTicket(ticket).catch(() => {});
  email.notifyNewTicket(ticket).catch(() => {});

  res.status(201).json(ticket);
});

// Get single ticket with its event log
router.get("/:id", (req, res) => {
  const ticket = getTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  const events = db
    .prepare("SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(ticket.id);
  res.json({ ...ticket, events });
});

// Update status
router.patch("/:id", requireAdmin, (req, res) => {
  const ticket = getTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const { status, author } = req.body || {};
  if (!status || !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}` });
  }

  const previousStatus = ticket.status;
  const timestamp = nowIso();
  const resolving = (status === "resolved" || status === "closed") && !ticket.resolved_at;
  const downtimeEnd =
    ticket.is_incident && !ticket.downtime_end && (status === "resolved" || status === "closed")
      ? timestamp
      : ticket.downtime_end;

  db.prepare(
    `UPDATE tickets SET status = ?, updated_at = ?, resolved_at = COALESCE(resolved_at, ?), downtime_end = ?
     WHERE id = ?`
  ).run(status, timestamp, resolving ? timestamp : null, downtimeEnd, ticket.id);

  const updated = getTicket(ticket.id);
  addEvent(updated.id, "status_change", `Status changed from ${previousStatus} to ${status}`, author);

  telegram.notifyStatusChange(updated, previousStatus).catch(() => {});
  email.notifyStatusChange(updated, previousStatus).catch(() => {});

  res.json(updated);
});

// Add a comment/update to a ticket
router.post("/:id/comments", requireAdmin, (req, res) => {
  const ticket = getTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const { message, author } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  addEvent(ticket.id, "comment", String(message).trim(), author);
  db.prepare("UPDATE tickets SET updated_at = ? WHERE id = ?").run(nowIso(), ticket.id);

  telegram.notifyComment(ticket, String(message).trim(), author).catch(() => {});

  const events = db
    .prepare("SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(ticket.id);
  res.status(201).json({ ...getTicket(ticket.id), events });
});

module.exports = router;
