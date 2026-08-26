const API = "/api/tickets";
let currentStatusFilter = "";
let tickets = [];
let counterInterval = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function getAdminToken() {
  return localStorage.getItem("it_admin_token") || "";
}

function openModal(id) {
  $(`#${id}`).classList.remove("hidden");
}
function closeModal(id) {
  $(`#${id}`).classList.add("hidden");
}

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
});

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

function timeAgo(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

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
      ? `Active downtime incident: #${active[0].id} - ${active[0].title}`
      : `${active.length} active downtime incidents in progress`;
}

function renderTicketList() {
  const list = $("#ticketList");
  if (tickets.length === 0) {
    list.innerHTML = `<div class="empty-state">No tickets yet.</div>`;
    return;
  }
  list.innerHTML = tickets
    .map((t) => {
      const downtimeHtml = t.is_incident
        ? `<span class="downtime-counter ${t.downtime_end ? "ended" : ""}" data-start="${t.downtime_start}" data-end="${t.downtime_end || ""}">⏱ --</span>`
        : "";
      return `
      <div class="ticket-card" data-id="${t.id}">
        <div class="ticket-card-top">
          <div>
            <span class="ticket-id">#${t.id}</span>
            <div class="ticket-title">${escapeHtml(t.title)}</div>
          </div>
          <span class="badge badge-${t.status}">${t.status.replace("_", " ")}</span>
        </div>
        <div class="ticket-meta">
          <span class="badge badge-${t.priority}">${t.priority}</span>
          <span>${escapeHtml(t.category)}</span>
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

  updateCounters();
}

function updateCounters() {
  $$(".downtime-counter").forEach((el) => {
    const start = el.dataset.start;
    const end = el.dataset.end;
    if (!start) return;
    const endTime = end ? new Date(end) : new Date();
    const ms = endTime - new Date(start);
    el.textContent = `⏱ ${formatDuration(ms)}${end ? " (resolved)" : ""}`;
  });
}

if (counterInterval) clearInterval(counterInterval);
counterInterval = setInterval(updateCounters, 1000);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function openTicketDetail(id) {
  const res = await fetch(`${API}/${id}`);
  if (!res.ok) return;
  const ticket = await res.json();
  $("#detailTitle").textContent = `#${ticket.id} - ${ticket.title}`;

  const downtimeSection = ticket.is_incident
    ? `<div class="detail-section">
         <h3>Downtime</h3>
         <div class="downtime-counter ${ticket.downtime_end ? "ended" : ""}" data-start="${ticket.downtime_start}" data-end="${ticket.downtime_end || ""}">⏱ --</div>
       </div>`
    : "";

  const eventsHtml = ticket.events
    .map(
      (e) => `<div class="event-item">
        <div class="event-meta">${e.type} · ${e.author ? escapeHtml(e.author) + " · " : ""}${timeAgo(e.created_at)}</div>
        <div>${escapeHtml(e.message)}</div>
      </div>`
    )
    .join("");

  const isAdmin = Boolean(getAdminToken());
  const statusButtons = ["open", "in_progress", "resolved", "closed"]
    .map(
      (s) =>
        `<button class="btn btn-sm ${s === ticket.status ? "btn-primary" : "btn-ghost"}" data-status="${s}" ${s === ticket.status ? "disabled" : ""}>${s.replace("_", " ")}</button>`
    )
    .join("");

  $("#detailBody").innerHTML = `
    <div class="detail-section">
      <h3>Details</h3>
      <div class="ticket-meta" style="margin-bottom:8px">
        <span class="badge badge-${ticket.status}">${ticket.status.replace("_", " ")}</span>
        <span class="badge badge-${ticket.priority}">${ticket.priority}</span>
        <span>${escapeHtml(ticket.category)}</span>
      </div>
      <div class="detail-desc">${escapeHtml(ticket.description)}</div>
    </div>
    <div class="detail-section">
      <h3>Requester</h3>
      <div>${escapeHtml(ticket.requester_name)} (${escapeHtml(ticket.requester_email)})</div>
    </div>
    ${downtimeSection}
    <div class="detail-section">
      <h3>Activity</h3>
      <div class="event-list">${eventsHtml || "<div class='empty-state'>No activity yet</div>"}</div>
    </div>
    ${
      isAdmin
        ? `<div class="detail-section">
             <h3>Update status</h3>
             <div class="status-controls" id="statusControls">${statusButtons}</div>
             <h3 style="margin-top:14px">Add comment</h3>
             <div class="comment-box">
               <input type="text" id="commentInput" placeholder="Add an update...">
               <button class="btn btn-primary btn-sm" id="commentBtn">Post</button>
             </div>
           </div>`
        : `<p style="color:var(--text-dim);font-size:13px">Sign in as admin to update status or add comments.</p>`
    }
  `;

  updateCounters();
  openModal("detailModal");

  if (isAdmin) {
    $("#statusControls").querySelectorAll("button[data-status]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await updateStatus(ticket.id, btn.dataset.status);
      });
    });
    $("#commentBtn").addEventListener("click", async () => {
      const input = $("#commentInput");
      if (!input.value.trim()) return;
      await postComment(ticket.id, input.value.trim());
    });
  }
}

async function updateStatus(id, status) {
  const res = await fetch(`${API}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-token": getAdminToken() },
    body: JSON.stringify({ status, author: "Admin" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err.error || "Failed to update status");
    return;
  }
  await openTicketDetail(id);
  await fetchTickets();
}

async function postComment(id, message) {
  const res = await fetch(`${API}/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-token": getAdminToken() },
    body: JSON.stringify({ message, author: "Admin" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err.error || "Failed to post comment");
    return;
  }
  await openTicketDetail(id);
}

// New ticket form
$("#newTicketBtn").addEventListener("click", () => openModal("newTicketModal"));

$("#newTicketForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  data.is_incident = form.is_incident.checked;

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

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
});

// Admin sign-in
$("#adminBtn").addEventListener("click", () => openModal("adminModal"));
$("#adminForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const token = e.target.token.value.trim();
  localStorage.setItem("it_admin_token", token);
  closeModal("adminModal");
  $("#adminBtn").textContent = "Admin ✓";
});
if (getAdminToken()) $("#adminBtn").textContent = "Admin ✓";

// Status tabs
$$("#statusTabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$("#statusTabs .tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentStatusFilter = tab.dataset.status;
    fetchTickets();
  });
});

$("#refreshBtn").addEventListener("click", fetchTickets);

fetchTickets();
setInterval(fetchTickets, 15000);
