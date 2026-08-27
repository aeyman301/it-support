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

import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, doc, writeBatch } from "firebase/firestore";

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

await upsertAll("materials", data.materials);
await upsertAll("purchaseOrders", data.purchaseOrders);
await upsertAll("productionPlan", data.productionPlan);

console.log("Done.", data.stats);
process.exit(0);
