const admin = require("firebase-admin");
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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
  });
}

const firestore = admin.firestore();
const bucket = process.env.FIREBASE_STORAGE_BUCKET ? admin.storage().bucket() : null;

if (!bucket) {
  console.warn("[firebase] FIREBASE_STORAGE_BUCKET not set - ticket attachments will be disabled.");
}

module.exports = createTicketRepository({
  firestore,
  FieldValue: admin.firestore.FieldValue,
  bucket,
});
