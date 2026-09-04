// Writes the JSON produced by extract_mrp_xlsx.py into Firestore, using the
// same client SDK and anonymous-auth flow the app itself uses.
//
// Usage:
//   node --env-file=.env.local scripts/import_to_firestore.mjs mrp_import.json
//
// Re-running is safe: materials, purchase orders, and production plan
// entries all use deterministic IDs (part code / part code + month), so a
// second import of the same or a newer monthly file upserts rather than
// duplicating.
//
// Materials get special handling: onHandQty is always refreshed from the
// spreadsheet (it's a live stock snapshot), but leadTimeDays, safetyStock,
// minOrderQty, supplier, shipFrom and notes are preserved untouched on any
// material that already exists — those get set once by hand (or from a
// dedicated lead-time workbook) and this monthly MRP report doesn't carry
// trustworthy values for them (it defaults leadTimeDays to 0 for every
// row). Only brand-new materials get the full record, defaults included.
// Materials tagged kind:"product" are never touched by this import.

import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDocs,
  getFirestore,
  writeBatch,
} from "firebase/firestore";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node import_to_firestore.mjs <path-to-json>");
  process.exit(1);
}

const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key} — run with node --env-file=.env.local`);
    process.exit(1);
  }
}

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

if (process.env.VITE_USE_FIRESTORE_EMULATOR === "true") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
}

await signInAnonymously(auth);

const data = JSON.parse(readFileSync(filePath, "utf-8"));

const PRESERVE_ON_EXISTING = [
  "leadTimeDays",
  "safetyStock",
  "minOrderQty",
  "supplier",
  "shipFrom",
  "notes",
];

async function upsertMaterials(records) {
  const existingSnap = await getDocs(collection(db, "materials"));
  const existing = {};
  existingSnap.forEach((d) => { existing[d.id] = d.data(); });

  const BATCH_SIZE = 400;
  let written = 0;
  let created = 0;
  let merged = 0;
  let skippedProducts = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const record of chunk) {
      const { id, ...fields } = record;
      const prior = existing[id];
      if (prior?.kind === "product") {
        skippedProducts++;
        continue;
      }
      if (prior) {
        const payload = { ...fields };
        for (const f of PRESERVE_ON_EXISTING) {
          if (prior[f] !== undefined) delete payload[f];
        }
        batch.set(doc(db, "materials", id), { ...payload, updatedAt: Date.now() }, { merge: true });
        merged++;
      } else {
        batch.set(doc(db, "materials", id), { ...fields, updatedAt: Date.now() });
        created++;
      }
    }
    await batch.commit();
    written += chunk.length;
    console.log(`materials: ${written}/${records.length}`);
  }
  console.log(
    `materials: ${created} created, ${merged} merged (curated fields preserved), ${skippedProducts} skipped (kind:product)`,
  );
}

// Component codes are written slightly differently between the workbook's
// sheets — the BOM sheet has "71162783" where the stock sheet has
// "7116-2783". Matching on letters and digits alone lets a BOM line point
// at the material that already exists instead of creating a near-duplicate.
const normalizeCode = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");

async function upsertProductsWithBom(products, components) {
  const snap = await getDocs(collection(db, "materials"));
  const existing = {};
  snap.forEach((d) => { existing[d.id] = d.data(); });

  const rawByNormalized = new Map();
  for (const [id, data] of Object.entries(existing)) {
    if (data.kind === "product") continue;
    rawByNormalized.set(normalizeCode(id), id);
  }

  // Create any component the BOM references that isn't a material yet, so
  // no BOM line ends up pointing at a missing record.
  const resolve = (code) => (existing[code] ? code : rawByNormalized.get(normalizeCode(code)) ?? code);
  const missing = (components ?? []).filter((c) => !existing[resolve(c.id)]);
  if (missing.length > 0) {
    await upsertMaterials(missing);
    for (const c of missing) existing[c.id] = c;
    for (const c of missing) rawByNormalized.set(normalizeCode(c.id), c.id);
  }

  let created = 0;
  let updated = 0;
  let remapped = 0;
  const BATCH_SIZE = 400;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const chunk = products.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const product of chunk) {
      const bom = product.bom.map((line) => {
        const resolved = resolve(line.materialId);
        if (resolved !== line.materialId) remapped++;
        return { materialId: resolved, qty: line.qty };
      });
      const prior = existing[product.id];
      if (prior) {
        // Keep the product's existing name/model (they may have been set by
        // hand with friendlier labels); only the recipe is refreshed.
        batch.set(
          doc(db, "materials", product.id),
          { bom, updatedAt: Date.now() },
          { merge: true },
        );
        updated++;
      } else {
        batch.set(doc(db, "materials", product.id), {
          code: product.code,
          name: product.name,
          model: product.model,
          kind: "product",
          bom,
          updatedAt: Date.now(),
        });
        created++;
      }
    }
    await batch.commit();
  }
  console.log(
    `products: ${created} created, ${updated} updated with a BOM, ${missing.length} missing components created, ${remapped} BOM lines remapped to an existing code`,
  );
}

async function upsertAll(collectionName, records) {
  const BATCH_SIZE = 400; // stay under Firestore's 500-write batch limit
  let written = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const record of chunk) {
      const { id, ...fields } = record;
      batch.set(doc(db, collectionName, id), {
        ...fields,
        updatedAt: Date.now(),
      });
    }
    await batch.commit();
    written += chunk.length;
    console.log(`${collectionName}: ${written}/${records.length}`);
  }
}

if (data.materials) await upsertMaterials(data.materials);
if (data.products) await upsertProductsWithBom(data.products, data.components);
if (data.purchaseOrders) await upsertAll("purchaseOrders", data.purchaseOrders);
if (data.productionPlan) await upsertAll("productionPlan", data.productionPlan);

console.log("Done.", data.stats);
process.exit(0);
