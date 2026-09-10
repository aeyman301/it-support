const { initializeApp, applicationDefault, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { createTicketRepository } = require("./ticketRepository");

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8"));
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  return null;
}

const serviceAccount = loadServiceAccount();

if (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error(
    "Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_BASE64 (or FIREBASE_SERVICE_ACCOUNT_JSON), " +
      "or GOOGLE_APPLICATION_CREDENTIALS, in your .env. See README.md for setup instructions."
  );
}

const app =
  getApps()[0] ||
  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
  });

const firestore = getFirestore(app);
const bucket = process.env.FIREBASE_STORAGE_BUCKET ? getStorage(app).bucket() : null;

if (!bucket) {
  console.warn("[firebase] FIREBASE_STORAGE_BUCKET not set - ticket attachments will be disabled.");
}

module.exports = createTicketRepository({ firestore, FieldValue, bucket });
