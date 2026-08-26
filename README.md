# IT Support Ticket System

A lightweight, self-hosted IT support ticket system with:

- 🌐 A web UI for submitting and tracking tickets
- 🤖 **Telegram bot notifications** on new tickets, status changes, and comments
- 📧 **Email documentation** — every ticket and status change is emailed to a documentation mailbox
- ⏱️ **Downtime counter** — flag a ticket as a service outage/incident and it tracks live downtime until resolved

No external database required — everything is stored in a local SQLite file.

## Quick start

```bash
npm install
cp .env.example .env
# edit .env with your Telegram bot token/chat id and SMTP details (see below)
npm start
```

Open http://localhost:3000

## Configuration (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Port to run the server on (default `3000`) |
| `ADMIN_TOKEN` | Shared secret required to change ticket status or post comments. Set this to something private and share it only with your IT team. |
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | Chat/user id to notify. Message your bot once, then visit `https://api.telegram.org/bot<token>/getUpdates` to find your chat id. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | SMTP server credentials used to send documentation emails |
| `EMAIL_FROM` | From address for outgoing mail |
| `EMAIL_DOCUMENTATION_TO` | Mailbox that receives a copy of every ticket (creation + status changes) for record-keeping |

If Telegram or SMTP variables are left blank, that channel is simply skipped (logged as disabled) — the rest of the app keeps working.

### Setting up the Telegram bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram, run `/newbot`, and copy the token into `TELEGRAM_BOT_TOKEN`.
2. Send any message to your new bot.
3. Visit `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates` in a browser and copy the `chat.id` value into `TELEGRAM_CHAT_ID`. (For a group, add the bot to the group first and use the group's chat id, which is negative.)

### Setting up email

Any standard SMTP provider works (Gmail with an app password, Office 365, SendGrid, Mailgun, your own mail server, etc). Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and set `EMAIL_DOCUMENTATION_TO` to the mailbox where you want tickets archived.

## How it works

- **Anyone** can submit a ticket from the web UI (name, email, title, description, category, priority, and an optional "this is a downtime incident" checkbox).
- Submitting a ticket immediately sends a Telegram notification and a documentation email.
- Checking **"This is a service outage / downtime incident"** starts a downtime clock (`downtime_start` = ticket creation time). The UI shows a live, ticking counter on that ticket until it's marked resolved or closed, at which point `downtime_end` is recorded and the total downtime duration is included in the resolution email/Telegram message.
- IT staff sign in with the shared `ADMIN_TOKEN` (via the "Admin sign-in" button — stored only in the browser's local storage) to change ticket status (`open → in_progress → resolved/closed`) and post comments. Both actions trigger Telegram notifications; status changes also trigger a documentation email.
- All ticket activity (creation, status changes, comments) is logged in an activity timeline visible in the ticket detail view.

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tickets` | none | List tickets (optional `?status=open`) |
| `POST` | `/api/tickets` | none | Create a ticket |
| `GET` | `/api/tickets/:id` | none | Get a ticket with its activity log |
| `PATCH` | `/api/tickets/:id` | `x-admin-token` header | Update status (`{ "status": "resolved", "author": "..." }`) |
| `POST` | `/api/tickets/:id/comments` | `x-admin-token` header | Add a comment (`{ "message": "...", "author": "..." }`) |

## Notes on security

This is designed for small-team internal use behind your own network/VPN or a reverse proxy with auth. The `ADMIN_TOKEN` is a simple shared secret, not per-user auth — for larger teams, put this behind SSO/reverse-proxy authentication and consider adding per-user accounts.
