# IT Support Ticket System

A self-hosted IT support ticket system with:

- 🌐 A web UI (Tickets / Knowledge Base / Users / Reports / Settings) for submitting and tracking tickets
- 🔥 **Firebase Firestore** as the database — free Spark plan is enough, no billing required
- 📎 **File attachments** (e.g. screenshots, `ipconfig` output) stored on local disk — no cloud storage or billing needed, works out of the box on cPanel or any host
- 🤖 **Telegram bot notifications** on new tickets, status changes, and comments
- 📧 **Email documentation** — every ticket and status change is emailed to a documentation mailbox
- ⏱️ **Downtime counter** — flag a ticket as a service outage/incident and it tracks live downtime until resolved

## Quick start

```bash
npm install
cp .env.example .env
# fill in .env: Firebase service account, Telegram bot, SMTP (see below)
npm start
```

Open http://localhost:3000

## 1. Set up Firebase (Firestore only)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Firestore** (Native mode, any region) in the project. This is on the free Spark plan — no billing/credit card needed.
3. Go to **Project settings → Service accounts → Generate new private key**. This downloads a JSON file.
4. Base64-encode it and put the result in `.env`:
   ```bash
   base64 -i service-account.json | tr -d '\n'
   ```
   Paste the output as `FIREBASE_SERVICE_ACCOUNT_BASE64`. (Or paste the raw JSON as `FIREBASE_SERVICE_ACCOUNT_JSON` instead — one line.)

Data model:
- `tickets/{ticketId}` — one document per ticket (title, description, requester, department, location, device, category, priority, status, downtime fields, attachments array)
- `tickets/{ticketId}/events/{eventId}` — the activity log (created / status_change / comment) for each ticket
- `counters/tickets` — a single document holding the next sequential ticket number (`#1001`, `#1002`, …), incremented in a transaction so numbers never collide

**Firestore index**: filtering the ticket list by status (`?status=open`) queries on `status ==` + orders by `created_at`, which needs a composite index. The first time you filter by status, Firestore's error message includes a direct link to auto-create it in the console — click it once and the query works from then on.

**Security rules**: this app talks to Firestore only from the server using the Admin SDK (which bypasses security rules), so the default locked-down rules are fine — don't open Firestore to public client access.

**Why not Firebase Storage for attachments?** Google now requires the Blaze (pay-as-you-go) plan to provision a Storage bucket at all, even for light usage. To keep this free to run, attachments are saved to local disk instead (see below) — everything else about Firebase (Firestore) stays on the free plan.

## 2. Attachments (local disk)

Uploaded files are written to a folder on the server (default: `uploads/` next to the app) and served back at `/uploads/...`. Nothing to configure for local/VPS use. On shared hosting like cPanel:
- Set `UPLOAD_DIR` in `.env` if you want files stored somewhere other than the default `uploads/` folder inside the app directory (e.g. a path outside your `public_html` webroot with more disk quota).
- Make sure the folder is writable by the Node process (normally the case by default for a folder the app creates itself).
- This folder holds real user-uploaded content — back it up like you would any other application data. It isn't tracked in git (`uploads/` is gitignored).
- Attachment links are plain URLs under `/uploads/...`, not authenticated — same trust model as the rest of the app (ticket details are also readable without login). Don't put anything in a ticket attachment you wouldn't want anyone with the link to see.

## 3. Set up Telegram

1. Message [@BotFather](https://t.me/BotFather), run `/newbot`, and copy the token into `TELEGRAM_BOT_TOKEN`.
2. Send any message to your new bot.
3. Visit `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates` and copy the `chat.id` into `TELEGRAM_CHAT_ID`. (For a group, add the bot to the group first — the group's chat id is negative.)

## 4. Set up email

Any standard SMTP provider works (Gmail with an app password, Office 365, SendGrid, Mailgun, your own mail server). Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and set `EMAIL_DOCUMENTATION_TO` to the mailbox where tickets are archived.

If Telegram or SMTP variables are left blank, that channel is skipped (logged as disabled) — the rest of the app keeps working. Firebase (Firestore) is required, since it's the database.

## How it works

- **Anyone** can submit a ticket from the web UI: name, email, title, description, department, location, device, category, priority, optional file attachments, and an optional "this is a downtime incident" checkbox.
- Submitting a ticket immediately sends a Telegram notification and a documentation email, and assigns the next sequential ticket number (`#1001`, `#1002`, …).
- Checking **"This is a service outage / downtime incident"** starts a downtime clock (`downtime_start` = ticket creation time). The UI shows a live, ticking counter on that ticket until it's marked resolved or closed, at which point `downtime_end` is recorded and the total downtime duration is included in the resolution email/Telegram message.
- IT staff sign in from **Settings** with the shared `ADMIN_TOKEN` (stored only in the browser's local storage) to change ticket status (`open → in_progress → resolved/closed`) and post comments. Both actions trigger Telegram notifications; status changes also trigger a documentation email.
- All ticket activity (creation, status changes, comments) is logged in an activity timeline visible in the ticket detail view.
- Attachments are stored on local disk and served directly by the app at `/uploads/...`.
- **Knowledge Base**, **Users**, and **Reports** are present in the navigation as placeholders for future functionality (self-service articles, staff/requester accounts, and ticket analytics) — not built out yet.

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tickets` | none | List tickets (optional `?status=open`) |
| `POST` | `/api/tickets` | none | Create a ticket (`multipart/form-data`, supports an `attachments` file field) |
| `GET` | `/api/tickets/:id` | none | Get a ticket with its activity log |
| `PATCH` | `/api/tickets/:id` | `x-admin-token` header | Update status (`{ "status": "resolved", "author": "..." }`) |
| `POST` | `/api/tickets/:id/comments` | `x-admin-token` header | Add a comment (`{ "message": "...", "author": "..." }`) |
| `GET` | `/api/config` | none | Reports which integrations (Telegram/email) are enabled |

## Notes on security

This is designed for small-team internal use behind your own network/VPN or a reverse proxy with auth. The `ADMIN_TOKEN` is a simple shared secret, not per-user auth — for larger teams, put this behind SSO/reverse-proxy authentication and consider per-user accounts (the "Users" section is a placeholder for that).
