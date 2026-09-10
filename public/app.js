const API = "/api/tickets";
let currentStatusFilter = "";
let searchQuery = "";
let tickets = [];
let currentDetailId = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function renderIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const svg = ICONS[el.dataset.icon];
    if (svg && !el.dataset.iconRendered) {
      el.innerHTML = svg;
      el.dataset.iconRendered = "1";
    }
  });
}
renderIcons();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function timeAgo(iso) {
  return new Date(iso).toLocaleString();
}

function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (days || hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ---------------- Admin session ---------------- */
function getAdmin() {
  return { token: localStorage.getItem("it_admin_token") || "", name: localStorage.getItem("it_admin_name") || "" };
}
function setAdmin(token, name) {
  localStorage.setItem("it_admin_token", token);
  localStorage.setItem("it_admin_name", name || "");
  refreshAvatar();
}
function clearAdmin() {
  localStorage.removeItem("it_admin_token");
  localStorage.removeItem("it_admin_name");
  refreshAvatar();
}
function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}
function refreshAvatar() {
  const admin = getAdmin();
  $("#avatarInitials").textContent = admin.token ? initials(admin.name || "Admin") : "?";
  const status = $("#adminStatus");
  const signOutBtn = $("#adminSignOutBtn");
  if (admin.token) {
    status.textContent = `Signed in as ${admin.name || "Admin"}.`;
    signOutBtn.classList.remove("hidden");
    $("#adminDisplayName").value = admin.name || "";
  } else {
    status.textContent = "Not signed in — ticket status changes and comments require the admin token.";
    signOutBtn.classList.add("hidden");
  }
}

/* ---------------- Navigation ---------------- */
const SECTIONS = ["tickets", "kb", "users", "reports", "settings"];
function showSection(name) {
  SECTIONS.forEach((s) => $(`#section-${s}`).classList.toggle("hidden", s !== name));
  $$(".nav-item").forEach((btn) => btn.classList.toggle("active", btn.dataset.section === name));
  if (name === "settings") loadIntegrationStatus();
}
$$(".nav-item").forEach((btn) => btn.addEventListener("click", () => showSection(btn.dataset.section)));
$("#avatarBtn").addEventListener("click", () => showSection("settings"));

async function loadIntegrationStatus() {
  try {
    const res = await fetch("/api/config");
    const cfg = await res.json();
    $("#telegramStatus").textContent = cfg.telegramEnabled ? "Enabled" : "Disabled";
    $("#telegramStatus").className = `badge ${cfg.telegramEnabled ? "badge-resolved" : "badge-closed"}`;
    $("#emailStatus").textContent = cfg.emailEnabled ? "Enabled" : "Disabled";
    $("#emailStatus").className = `badge ${cfg.emailEnabled ? "badge-resolved" : "badge-closed"}`;
  } catch {
    /* ignore */
  }
}

/* ---------------- Tickets: list ---------------- */
async function fetchTickets() {
  const url = currentStatusFilter ? `${API}?status=${currentStatusFilter}` : API;
  const res = await fetch(url);
  tickets = await res.json();
  renderTicketList();
  renderIncidentBanner();
}

function renderIncidentBanner() {
  const active = tickets.filter((t) => t.is_incident && !t.downtime_end);
  const banner = $("#incidentBanner");
  if (active.length === 0) {
    banner.classList.add("hidden");
    return;
  }
  banner.classList.remove("hidden");
  $("#incidentBannerText").textContent =
    active.length === 1
      ? `Active downtime incident: #${active[0].number} - ${active[0].title}`
      : `${active.length} active downtime incidents in progress`;
}

function matchesSearch(t) {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return (
    t.title.toLowerCase().includes(q) ||
    t.requester_name.toLowerCase().includes(q) ||
    String(t.number).includes(q) ||
    (t.department || "").toLowerCase().includes(q)
  );
}

function renderTicketList() {
  const list = $("#ticketList");
  const visible = tickets.filter(matchesSearch);
  if (visible.length === 0) {
    list.innerHTML = `<div class="empty-state">No tickets found.</div>`;
    return;
  }
  list.innerHTML = visible
    .map((t) => {
      const downtimeHtml = t.is_incident
        ? `<span class="downtime-counter ${t.downtime_end ? "ended" : ""}" data-start="${t.downtime_start}" data-end="${t.downtime_end || ""}"><i data-icon="clock"></i>--</span>`
        : "";
      return `
      <div class="ticket-card" data-id="${t.id}">
        <div class="ticket-card-top">
          <div>
            <span class="ticket-id">#${t.number}</span>
            <div class="ticket-title">${escapeHtml(t.title)}</div>
          </div>
          <span class="badge badge-${t.status}">${t.status.replace("_", " ")}</span>
        </div>
        <div class="ticket-meta">
          <span class="badge badge-${t.priority}">${t.priority}</span>
          <span>${escapeHtml(t.department || t.category)}</span>
          <span>${escapeHtml(t.requester_name)}</span>
          <span>${timeAgo(t.created_at)}</span>
          ${downtimeHtml}
        </div>
      </div>`;
    })
    .join("");

  list.querySelectorAll(".ticket-card").forEach((card) => {
    card.addEventListener("click", () => openTicketDetail(card.dataset.id));
  });
  renderIcons(list);
  updateCounters();
}

$$("#statusTabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$("#statusTabs .tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentStatusFilter = tab.dataset.status;
    fetchTickets();
  });
});
$("#refreshBtn").addEventListener("click", fetchTickets);
$("#searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value.trim();
  renderTicketList();
});

/* ---------------- Downtime counters (live) ---------------- */
function updateCounters() {
  $$(".downtime-counter").forEach((el) => {
    const start = el.dataset.start;
    const end = el.dataset.end;
    if (!start) return;
    const endTime = end ? new Date(end) : new Date();
    const ms = endTime - new Date(start);
    const icon = el.querySelector("i") ? el.querySelector("i").outerHTML : "";
    el.innerHTML = `${icon}${formatDuration(ms)}${end ? " (resolved)" : ""}`;
  });
}
setInterval(updateCounters, 1000);

/* ---------------- Tickets: detail ---------------- */
function fieldRow(icon, label, value) {
  if (!value) return "";
  return `<div class="field-row"><span class="field-icon"><i data-icon="${icon}"></i></span><span class="field-label">${label}</span><span class="field-value">${escapeHtml(value)}</span></div>`;
}

async function openTicketDetail(id) {
  currentDetailId = id;
  const res = await fetch(`${API}/${id}`);
  if (!res.ok) return;
  const ticket = await res.json();

  const downtimeHtml = ticket.is_incident
    ? `<div class="detail-section">
         <h3>Downtime</h3>
         <div class="downtime-box ${ticket.downtime_end ? "ended" : ""}">
           <i data-icon="clock"></i>
           <span class="downtime-counter ${ticket.downtime_end ? "ended" : ""}" data-start="${ticket.downtime_start}" data-end="${ticket.downtime_end || ""}">--</span>
         </div>
       </div>`
    : "";

  const attachmentsHtml =
    ticket.attachments && ticket.attachments.length
      ? `<div class="detail-section"><h3>Attachments</h3><div class="attachment-list">${ticket.attachments
          .map(
            (a) => `<div class="attachment-item">
              <i data-icon="clip" class="clip-icon"></i>
              <span class="attachment-name">${escapeHtml(a.name)}</span>
              <span class="attachment-size">${formatBytes(a.size)}</span>
              ${a.url ? `<a class="download-link" href="${a.url}" target="_blank" rel="noopener"><i data-icon="download"></i></a>` : ""}
            </div>`
          )
          .join("")}</div></div>`
      : "";

  const eventsHtml = (ticket.events || [])
    .map(
      (e) => `<div class="event-item">
        <div class="event-meta">${e.type.replace("_", " ")} · ${e.author ? escapeHtml(e.author) + " · " : ""}${timeAgo(e.created_at)}</div>
        <div>${escapeHtml(e.message)}</div>
      </div>`
    )
    .join("");

  const admin = getAdmin();
  const isAdmin = Boolean(admin.token);
  const statusButtons = ["open", "in_progress", "resolved", "closed"]
    .filter((s) => s !== ticket.status)
    .map((s) => `<button class="btn btn-sm btn-ghost" data-status="${s}">${s.replace("_", " ")}</button>`)
    .join("");

  $("#detailCard").innerHTML = `
    <div class="detail-top">
      <span class="detail-number">#${ticket.number}</span>
      <span class="badge badge-${ticket.status}">${ticket.status.replace("_", " ")}</span>
    </div>
    <div class="detail-title">${escapeHtml(ticket.title)}</div>

    <div class="requester-row">
      <div class="requester-avatar"><i data-icon="users"></i></div>
      <div>
        <div class="requester-name">${escapeHtml(ticket.requester_name)}</div>
        <div class="requester-email">${escapeHtml(ticket.requester_email)}</div>
      </div>
      <div class="requester-time">${timeAgo(ticket.created_at)}</div>
    </div>

    <div class="field-grid">
      ${fieldRow("building", "Department", ticket.department)}
      ${fieldRow("pin", "Location", ticket.location)}
      ${fieldRow("laptop", "Device", ticket.device)}
      <div class="field-row"><span class="field-icon"><i data-icon="alert"></i></span><span class="field-label">Priority</span><span class="badge badge-${ticket.priority}">${ticket.priority}</span></div>
    </div>

    <div class="detail-section">
      <h3>Description</h3>
      <div class="detail-desc-box">${escapeHtml(ticket.description)}</div>
    </div>

    ${attachmentsHtml}
    ${downtimeHtml}

    <div class="detail-section">
      <h3>Activity</h3>
      <div class="event-list">${eventsHtml || "<div class='empty-state'>No activity yet</div>"}</div>
    </div>

    ${
      isAdmin
        ? `<div class="detail-section">
             <h3>Update status</h3>
             <div class="status-controls" id="statusControls">${statusButtons || "<span class='admin-hint'>No further status changes</span>"}</div>
             <h3 style="margin-top:16px">Add comment</h3>
             <div class="comment-box">
               <input type="text" id="commentInput" placeholder="Add an update...">
               <button class="btn btn-primary btn-sm" id="commentBtn">Post</button>
             </div>
           </div>`
        : `<p class="admin-hint">Sign in from Settings to update status or add comments.</p>`
    }
  `;

  renderIcons($("#detailCard"));
  updateCounters();

  $("#ticketsListView").classList.add("hidden");
  $("#ticketDetailView").classList.remove("hidden");

  if (isAdmin) {
    $("#statusControls")?.querySelectorAll("button[data-status]").forEach((btn) => {
      btn.addEventListener("click", () => updateStatus(ticket.id, btn.dataset.status));
    });
    $("#commentBtn").addEventListener("click", () => {
      const input = $("#commentInput");
      if (!input.value.trim()) return;
      postComment(ticket.id, input.value.trim());
    });
  }
}

$("#backToListBtn").addEventListener("click", () => {
  $("#ticketDetailView").classList.add("hidden");
  $("#ticketsListView").classList.remove("hidden");
  currentDetailId = null;
  fetchTickets();
});

async function updateStatus(id, status) {
  const admin = getAdmin();
  const res = await fetch(`${API}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-token": admin.token },
    body: JSON.stringify({ status, author: admin.name || "Admin" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err.error || "Failed to update status");
    return;
  }
  await openTicketDetail(id);
}

async function postComment(id, message) {
  const admin = getAdmin();
  const res = await fetch(`${API}/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-token": admin.token },
    body: JSON.stringify({ message, author: admin.name || "Admin" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err.error || "Failed to post comment");
    return;
  }
  await openTicketDetail(id);
}

/* ---------------- New ticket modal ---------------- */
function openModal(id) {
  $(`#${id}`).classList.remove("hidden");
}
function closeModal(id) {
  $(`#${id}`).classList.add("hidden");
}
$$("[data-close]").forEach((btn) => btn.addEventListener("click", () => closeModal(btn.dataset.close)));
$$(".modal").forEach((modal) => modal.addEventListener("click", (e) => e.target === modal && modal.classList.add("hidden")));

$("#newTicketBtn").addEventListener("click", () => openModal("newTicketModal"));

$("#newTicketForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  formData.set("is_incident", form.is_incident.checked ? "true" : "false");

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const res = await fetch(API, { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      $("#newTicketError").textContent = err.error || "Failed to create ticket";
      $("#newTicketError").classList.remove("hidden");
      return;
    }
    $("#newTicketError").classList.add("hidden");
    form.reset();
    closeModal("newTicketModal");
    await fetchTickets();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Ticket";
  }
});

/* ---------------- Settings / admin form ---------------- */
$("#adminForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const token = $("#adminTokenInput").value.trim();
  const name = $("#adminDisplayName").value.trim();
  if (!token) return;
  setAdmin(token, name);
  $("#adminTokenInput").value = "";
});
$("#adminSignOutBtn").addEventListener("click", () => {
  clearAdmin();
  $("#adminDisplayName").value = "";
});

/* ---------------- Init ---------------- */
refreshAvatar();
fetchTickets();
setInterval(fetchTickets, 15000);
