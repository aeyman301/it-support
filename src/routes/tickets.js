const express = require("express");
const multer = require("multer");
const repo = require("../db/firestore");
const telegram = require("../services/telegram");
const email = require("../services/email");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 5 } });

function requireAdmin(req, res, next) {
  const token = req.get("x-admin-token");
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || token !== expected) {
    return res.status(401).json({ error: "Invalid or missing admin token" });
  }
  next();
}

function parseBool(value) {
  return value === true || value === "true" || value === "on";
}

// List tickets (optionally filter by status)
router.get("/", async (req, res, next) => {
  try {
    const tickets = await repo.listTickets(req.query.status);
    res.json(
      tickets.map((t) => ({
        ...t,
        attachments: (t.attachments || []).map((a) => ({ name: a.name, size: a.size })),
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Create ticket (multipart form with optional file attachments, or plain JSON)
router.post("/", upload.array("attachments", 5), async (req, res, next) => {
  try {
    const { title, description, requester_name, requester_email, category, priority, department, location, device } =
      req.body || {};

    if (!title || !description || !requester_name || !requester_email) {
      return res.status(400).json({ error: "title, description, requester_name and requester_email are required" });
    }

    const ticket = await repo.createTicket({
      title: String(title).trim(),
      description: String(description).trim(),
      requester_name: String(requester_name).trim(),
      requester_email: String(requester_email).trim(),
      category: category && String(category).trim(),
      priority,
      department: department && String(department).trim(),
      location: location && String(location).trim(),
      device: device && String(device).trim(),
      is_incident: parseBool(req.body.is_incident),
    });

    if (req.files && req.files.length > 0) {
      const uploaded = await Promise.all(req.files.map((file) => repo.uploadAttachment(ticket.id, file)));
      await repo.addAttachments(ticket.id, uploaded);
      ticket.attachments = uploaded;
    }

    await repo.addEvent(ticket.id, { type: "created", message: "Ticket created", author: ticket.requester_name });

    telegram.notifyNewTicket(ticket).catch(() => {});
    email.notifyNewTicket(ticket).catch(() => {});

    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

// Get single ticket with its event log and signed attachment URLs
router.get("/:id", async (req, res, next) => {
  try {
    const ticket = await repo.getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    const [events, attachments] = await Promise.all([
      repo.listEvents(ticket.id),
      repo.resolveAttachmentUrls(ticket.attachments),
    ]);
    res.json({ ...ticket, attachments, events });
  } catch (err) {
    next(err);
  }
});

// Update status
router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existing = await repo.getTicket(req.params.id);
    if (!existing) return res.status(404).json({ error: "Ticket not found" });

    const { status, author } = req.body || {};
    if (!status || !repo.STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${repo.STATUSES.join(", ")}` });
    }

    const previousStatus = existing.status;
    const updated = await repo.updateTicketStatus(existing.id, status);
    await repo.addEvent(updated.id, {
      type: "status_change",
      message: `Status changed from ${previousStatus} to ${status}`,
      author,
    });

    telegram.notifyStatusChange(updated, previousStatus).catch(() => {});
    email.notifyStatusChange(updated, previousStatus).catch(() => {});

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Add a comment/update to a ticket
router.post("/:id/comments", requireAdmin, async (req, res, next) => {
  try {
    const ticket = await repo.getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const { message, author } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    await repo.addEvent(ticket.id, { type: "comment", message: String(message).trim(), author });
    telegram.notifyComment(ticket, String(message).trim(), author).catch(() => {});

    const [refreshed, events] = await Promise.all([repo.getTicket(ticket.id), repo.listEvents(ticket.id)]);
    res.status(201).json({ ...refreshed, events });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
