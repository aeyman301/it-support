# Material Planning

A small internal tool for material planning: each material gets its own
configurable **lead time**, and the planning dashboard combines that with
warehouse stock, outstanding purchase orders, and the production plan to
tell you what needs to be ordered and by when — instead of working it out
by hand for every material.

It's a React + TypeScript app (built with Vite) using **Firestore** (Google
Firebase) as its database, so multiple people can see the same live data.

## What it does

- **Materials** — a master list of materials, each with its own lead time
  (days from placing a PO to it arriving), safety stock, minimum order
  quantity, and current on-hand quantity at the warehouse.
- **Outstanding Orders** — purchase orders you've placed but haven't
  received yet. The expected arrival date is auto-calculated as
  `order date + material lead time`, and can be overridden once a supplier
  confirms a different date. Marking an order "received" adds its quantity
  to the material's on-hand stock.
- **Production Plan** — how much of each material is needed and by when
  (from work orders / sales orders / your own forecast).
- **Planning Dashboard** — for every material, projects the stock balance
  forward in time using on-hand stock + incoming outstanding orders − planned
  demand. Whenever that projection would fall below safety stock, it works
  backwards using the material's lead time to tell you the last date you can
  place a new order ("order by") and a suggested quantity, flagging
  anything already overdue as urgent.

## Getting started

```bash
cd erp
npm install
cp .env.example .env.local   # then fill in your Firebase config, see below
npm run dev
```

Until `.env.local` is filled in, the app shows setup instructions instead of
a blank/stuck screen.

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and
   create a new project (or use an existing one).
2. **Build → Firestore Database → Create database** — start in production
   mode (the rules shipped here lock it down anyway).
3. **Build → Authentication → Get started → Sign-in method → Anonymous** —
   enable it. See the security note below for why.
4. **Project settings → General → Your apps → Add app → Web** — register an
   app and copy the `firebaseConfig` values into `erp/.env.local`.

### 2. Deploy the security rules

```bash
npm install -g firebase-tools   # once
firebase login
firebase use --add              # pick your project
firebase deploy --only firestore:rules
```

### 3. Run it

```bash
npm run dev
```

Open the printed local URL, add your first material with its lead time, log
an outstanding PO, add a production plan entry, then check the Planning
Dashboard.

## Data model (Firestore collections)

- `materials/{id}`: `code, name, uom, leadTimeDays, safetyStock, minOrderQty, onHandQty, notes`
- `purchaseOrders/{id}`: `materialId, poNumber, orderDate, qty, expectedArrivalDate, status ("outstanding" | "received" | "cancelled"), receivedDate?, notes`
- `productionPlan/{id}`: `materialId, neededByDate, qty, source?, notes`

The planning math lives in [`src/lib/mrp.ts`](src/lib/mrp.ts) as a small,
pure, unit-testable function — it doesn't touch Firestore directly, so it's
easy to verify or extend independently of the UI.

## Security note

The shipped `firestore.rules` require a signed-in user, and the app signs
everyone in **anonymously** on load so it works without building a login
screen first. That keeps the data out of reach of anyone who doesn't have
the app open, but it is **not** real access control — anyone who obtains the
Firebase config (which is not a secret in client apps) could sign in the
same way. Before rolling this out beyond a quick internal trial, replace
anonymous auth with real sign-in (e.g. Google sign-in restricted to your
company's email domain via [Firebase Auth's provider
settings](https://firebase.google.com/docs/auth/web/google-signin) and a
matching rule such as
`request.auth.token.email.matches('.*@yourcompany[.]com')`).

## Local development without a real Firebase project

You can run against the [Firebase Local
Emulator Suite](https://firebase.google.com/docs/emulator-suite) instead of
a live project:

```bash
npm install -g firebase-tools
firebase emulators:start   # starts Auth + Firestore emulators per firebase.json
```

Then set `VITE_USE_FIRESTORE_EMULATOR=true` in `.env.local` (any
placeholder values are fine for the other `VITE_FIREBASE_*` vars in this
mode) and run `npm run dev` as usual.

## Bulk-updating lead times from a spreadsheet

The Materials & Lead Time page has an **"Import lead times from a
spreadsheet"** card: upload a CSV export of any lead-time spreadsheet (in
Excel or Google Sheets, File → Save As / Download → CSV) and it auto-detects
which column holds the material code, lead time, safety stock, etc. — you
can adjust the mapping before importing. Rows are matched to existing
materials by code; matches are updated, unmatched codes are reported but
skipped (no new materials are created). Only CSV is supported, not `.xlsx`
directly — the only real Excel-parsing library for browsers has unpatched
security advisories, so it isn't used here.

## Importing from the monthly MRP workbook

If the supply chain team's monthly "MRP PLAN ALL" Excel file is available,
its Raw Stock and MRP sheets can be imported directly instead of entering
materials by hand:

```bash
cd erp/scripts
pip install openpyxl   # once
python3 extract_mrp_xlsx.py "/path/to/AUG26_MRP_PLAN_ALL_Rev0.xlsx" --out mrp_import.json
node --env-file=../.env.local import_to_firestore.mjs mrp_import.json
```

This pulls in materials (code, description, supplier, UOM, current on-hand
stock — **lead time is not in the source file and always imports as unset**,
so it still needs to be filled in per material), outstanding orders (from
the MRP sheet's monthly incoming schedule), and production plan demand
(from its monthly usage forecast). Re-running with a newer month's file is
safe — every imported record uses a deterministic ID (part code, or part
code + month), so it upserts instead of duplicating. Use `extract_mrp_xlsx.py
--limit N` to try a small batch first.

The planning dashboard treats a material with no lead time set as "not yet
configured" rather than guessing — it won't appear in the order-suggestions
list (which would otherwise be misleading), and instead shows up in a
separate "Lead time not set" count until you fill it in.

## Deploying

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

## Possible next steps

- Real sign-in (see security note above) with per-user roles (buyer vs.
  read-only viewer).
- CSV import/export for materials and production plan bulk updates.
- Multiple warehouses/locations per material.
- Supplier-specific lead times (a material can have more than one supplier).
