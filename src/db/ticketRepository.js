const STATUSES = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "medium", "high", "critical"];

function nowIso() {
  return new Date().toISOString();
}

/**
 * Firestore-backed ticket repository, built as an injectable factory so tests
 * can swap in a mock {firestore, FieldValue, bucket} without touching real Firebase.
 */
function createTicketRepository({ firestore, FieldValue, bucket }) {
  const ticketsCol = firestore.collection("tickets");
  const counterRef = firestore.collection("counters").doc("tickets");

  function serializeTicket(doc) {
    if (!doc || !doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async function nextTicketNumber() {
    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists ? snap.data().seq || 0 : 1000;
      const next = current + 1;
      tx.set(counterRef, { seq: next }, { merge: true });
      return next;
    });
  }

  async function createTicket(input) {
    const number = await nextTicketNumber();
    const timestamp = nowIso();
    const incident = Boolean(input.is_incident);
    const data = {
      number,
      title: input.title,
      description: input.description,
      requester_name: input.requester_name,
      requester_email: input.requester_email,
      department: input.department || "",
      location: input.location || "",
      device: input.device || "",
      category: input.category || "other",
      priority: PRIORITIES.includes(input.priority) ? input.priority : "medium",
      status: "open",
      is_incident: incident,
      downtime_start: incident ? timestamp : null,
      downtime_end: null,
      attachments: input.attachments || [],
      created_at: timestamp,
      updated_at: timestamp,
      resolved_at: null,
    };
    const ref = await ticketsCol.add(data);
    return { id: ref.id, ...data };
  }

  async function getTicket(id) {
    const doc = await ticketsCol.doc(id).get();
    return serializeTicket(doc);
  }

  async function listTickets(status) {
    const query =
      status && STATUSES.includes(status)
        ? ticketsCol.where("status", "==", status).orderBy("created_at", "desc")
        : ticketsCol.orderBy("created_at", "desc");
    const snap = await query.get();
    return snap.docs.map(serializeTicket);
  }

  async function updateTicketStatus(id, status) {
    const ref = ticketsCol.doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const ticket = serializeTicket(doc);
    const timestamp = nowIso();
    const resolving = status === "resolved" || status === "closed";
    const updates = { status, updated_at: timestamp };
    if (resolving && !ticket.resolved_at) updates.resolved_at = timestamp;
    if (ticket.is_incident && !ticket.downtime_end && resolving) updates.downtime_end = timestamp;
    await ref.update(updates);
    return getTicket(id);
  }

  async function addEvent(ticketId, { type, message, author }) {
    const timestamp = nowIso();
    const eventRef = await ticketsCol.doc(ticketId).collection("events").add({
      type,
      message,
      author: author || null,
      created_at: timestamp,
    });
    await ticketsCol.doc(ticketId).update({ updated_at: timestamp });
    const doc = await eventRef.get();
    return { id: doc.id, ...doc.data() };
  }

  async function listEvents(ticketId) {
    const snap = await ticketsCol.doc(ticketId).collection("events").orderBy("created_at", "asc").get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async function addAttachments(ticketId, attachments) {
    if (!attachments || attachments.length === 0) return;
    await ticketsCol.doc(ticketId).update({
      attachments: FieldValue.arrayUnion(...attachments),
      updated_at: nowIso(),
    });
  }

  async function uploadAttachment(ticketId, file) {
    if (!bucket) {
      throw new Error("Firebase Storage is not configured (set FIREBASE_STORAGE_BUCKET)");
    }
    const storagePath = `tickets/${ticketId}/${Date.now()}-${file.originalname}`;
    await bucket.file(storagePath).save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });
    return {
      name: file.originalname,
      path: storagePath,
      size: file.size,
      contentType: file.mimetype,
      uploaded_at: nowIso(),
    };
  }

  async function signAttachmentUrl(storagePath) {
    if (!bucket) return null;
    const [url] = await bucket.file(storagePath).getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });
    return url;
  }

  async function resolveAttachmentUrls(attachments) {
    if (!attachments || attachments.length === 0) return [];
    return Promise.all(
      attachments.map(async (a) => ({ ...a, url: await signAttachmentUrl(a.path) }))
    );
  }

  return {
    STATUSES,
    PRIORITIES,
    createTicket,
    getTicket,
    listTickets,
    updateTicketStatus,
    addEvent,
    listEvents,
    addAttachments,
    uploadAttachment,
    resolveAttachmentUrls,
  };
}

module.exports = { createTicketRepository, STATUSES, PRIORITIES };
