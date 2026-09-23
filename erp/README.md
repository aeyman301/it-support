# PNA Material Planning

An internal MRP tool for PNA Technologies: it holds the **bill of materials**
for every wire harness we build, takes the **production plan** of customer
orders and forecasts, explodes one through the other, and combines the result
with warehouse stock and outstanding purchase orders to say **what to order
and by when** — instead of working that out by hand for hundreds of
components.

React + TypeScript (Vite) on **Firestore** (Google Firebase), so everyone
sees the same live data.

## The five pages

- **Planning Dashboard** — for every raw material, projects the stock balance
  forward using on-hand stock + incoming orders − planned demand. Whenever
  that projection would fall below safety stock, it works backwards along the
  material's lead time to give the last date a PO can be placed ("order by")
  and a suggested quantity, flagging anything already overdue as urgent. Also
  rolls up what each product's orders consume.
- **Inventory Stock** — the raw material master: code, description, supplier,
  where it ships from, UOM, lead time, safety stock, minimum order quantity
  and current on-hand quantity.
- **Bill of Materials (BOM)** — the recipe for each finished product: which
  raw materials it consumes and how much of each, **per unit**. Products are
  grouped by model (Perodua D42L, Proton Exora, Isuzu VL20, …).
- **Outstanding Orders** — purchase orders placed but not yet received.
  Expected arrival defaults to `order date + material lead time` and can be
  overridden once a supplier confirms. Marking an order received adds its
  quantity to on-hand stock.
- **Production Plan** — customer orders and forecast: which product, how
  many, needed by when. A "current month planning" card explodes this
  month's orders through their BOM recipes into a **material forecast**,
  showing forecast demand, on-hand stock and projected shortfall per
  component.

### Products and raw materials

Both live in the `materials` collection; a finished product is a document
tagged `kind: "product"` with a `model` and a `bom` array. The app splits
them on load, so products never appear in inventory or purchasing views —
they're only offered in the production plan's product picker and on the BOM
page.

Demand is never stored twice. A plan entry records the product and the
quantity; the materials it consumes are derived from the product's recipe at
read time (`resolveEntryItems` in [`src/lib/mrp.ts`](src/lib/mrp.ts)). Fix a
BOM once and every forecast, dashboard rollup and order suggestion moves with
it.

## Getting started

From the app directory (the repository root here; `erp/` if you're in the
`it-support` monorepo):

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase config, see below
npm run dev
```

Until `.env.local` is filled in, the app shows setup instructions rather than
a blank screen.

### 1. Create a Firebase project

1. In the [Firebase console](https://console.firebase.google.com/), create a
   project (or use an existing one).
2. **Build → Firestore Database → Create database** — production mode is
   fine; the rules shipped here lock it down.
3. **Build → Authentication → Get started → Sign-in method → Anonymous** —
   enable it. See the security note below for why.
4. **Project settings → General → Your apps → Add app → Web** — register an
   app and copy the `firebaseConfig` values into `.env.local`.

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

## Data model (Firestore collections)

- `materials/{partCode}` — raw material: `code, name, uom, leadTimeDays,
  safetyStock, minOrderQty, onHandQty, supplier?, shipFrom?, notes?`
- `materials/{partCode}` with `kind: "product"` — finished product: `code,
  name, model, bom: [{ materialId, qty }]` where `qty` is **per unit**
- `purchaseOrders/{id}` — `materialId, poNumber, orderDate, qty,
  expectedArrivalDate, status ("outstanding" | "received" | "cancelled"),
  receivedDate?, notes?`
- `productionPlan/{id}` — `productId, productQty, productName, neededByDate,
  source?, notes?`, plus an optional `items: [{ materialId, qty }]` for an
  order whose materials are entered by hand instead of coming from the BOM

The planning math lives in [`src/lib/mrp.ts`](src/lib/mrp.ts) as pure
functions that don't touch Firestore, so it can be verified or extended
independently of the UI. `buildDemandIndex` rolls the whole plan up once per
render rather than re-walking it per material — a few hundred harnesses of
~85 components each against ~900 materials is tens of millions of iterations
otherwise.

## Importing from the monthly MRP workbook

The supply chain team's monthly "MRP PLAN ALL" workbook can be loaded
directly. Three sheets matter, each with its own extractor in `scripts/`:

```bash
pip install openpyxl   # once

# 1. Sheet "1. Raw Stock - Warehouse" + "MRP" → materials, incoming POs
python3 scripts/extract_mrp_xlsx.py "SEP26_MRP_PLAN_ALL_Rev0.xlsx" --out mrp.json

# 2. Sheet "4. Summ FC By Component" → the bill of materials
python3 scripts/extract_bom_xlsx.py "SEP26_MRP_PLAN_ALL_Rev0.xlsx" --out bom.json

# 3. Sheet "3. Summ FC By Harness - PPC" → the production plan and forecast
python3 scripts/extract_harness_plan_xlsx.py "SEP26_MRP_PLAN_ALL_Rev0.xlsx" --out plan.json

# then load each one
node --env-file=.env.local scripts/import_to_firestore.mjs bom.json
```

The harness sheet is the **source** plan: one row per finished harness, with
a FIRM quantity for the committed month and FC quantities for the forecast
months after it. The MRP sheet's own raw-material demand is that same
forecast already exploded through the BOM, so it isn't imported — storing it
would duplicate what the recipes say.

Re-running with a newer month is safe. Every record uses a deterministic ID
(part code, or part code + month), so imports upsert rather than duplicate,
and the importer protects hand-curated data:

- `leadTimeDays`, `safetyStock`, `minOrderQty`, `supplier`, `shipFrom` and
  `notes` are **preserved** on any material that already exists — the monthly
  report writes `leadTimeDays: 0` for every row and would otherwise wipe them.
  On-hand quantity is always refreshed, since that's a live stock snapshot.
- An import carrying no BOM never blanks a recipe that's already set.
- BOM lines are matched on letters and digits alone, so a component written
  `71162783` on one sheet and `7116-2783` on another resolves to the one
  material rather than creating a near-duplicate.

Materials with no lead time set are treated as "not yet configured" rather
than guessed at: they're kept out of the order-suggestions list and counted
separately, so a missing lead time can't silently invent or hide urgency.

### Known gap: units of measure

The BOM sheet states consumption in the unit a harness uses (metres of tape,
metres of tubing), while the warehouse counts purchase units (rolls). For
about 23 materials — vinyl tape, OPP/masking tape, NTVS tubing, the `430W21xx`
family — the forecast therefore overstates demand by the roll length (×20,
×30, ×35, ×50 and up). Every other material reconciles with the MRP sheet's
own figures to within rounding. Fixing this properly needs a per-material
conversion factor applied when a recipe is exploded; until then, treat the
forecast for those items as metres, not rolls.

## Bulk-updating lead times from a spreadsheet

The Inventory Stock page has an **"Import lead times from a spreadsheet"**
card: upload a CSV export (Excel or Google Sheets → File → Save As /
Download → CSV) and it auto-detects which column holds the material code,
lead time, safety stock and so on, with the mapping editable before import.
Rows match existing materials by code; unmatched codes are reported and
skipped, never created. CSV only — the one real browser Excel parser has
unpatched security advisories, so it isn't used here.

## Local development without a real Firebase project

```bash
npm install -g firebase-tools
firebase emulators:start --only auth,firestore
```

Set `VITE_USE_FIRESTORE_EMULATOR=true` in `.env.local` (placeholder values
are fine for the other `VITE_FIREBASE_*` vars in this mode) and run
`npm run dev`. The scripts in `scripts/` honour the same flag, so a workbook
can be imported into the emulator first to check what it would do.

## Security note

The shipped `firestore.rules` require a signed-in user, and the app signs
everyone in **anonymously** on load so it works without building a login
screen first. That keeps the data out of reach of anyone who doesn't have the
app open, but it is **not** real access control — anyone who obtains the
Firebase config (which is not a secret in client apps) could sign in the same
way. Before rolling this out more widely, replace anonymous auth with real
sign-in, e.g. Google sign-in restricted to the company domain via [Firebase
Auth's provider settings](https://firebase.google.com/docs/auth/web/google-signin)
and a rule such as `request.auth.token.email.matches('.*@pnatech[.]com[.]my')`.

## Deploying

```bash
npm run build      # tsc -b && vite build → dist/
npm run lint       # oxlint
```

`dist/` is a static bundle — deploy with `firebase deploy --only
hosting,firestore:rules`, or upload its contents to any web host.

## Possible next steps

- Per-material unit conversion, to close the metres-vs-rolls gap above.
- Real sign-in (see the security note) with roles: buyer vs. read-only.
- Multiple warehouses/locations per material.
- Supplier-specific lead times (a material can have more than one supplier).
