const { initializeApp, applicationDefault, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { createTicketRepository } = require("./ticketRepository");
const uploadsDir = require("../uploadDir");

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
  });

const firestore = getFirestore(app);

module.exports = createTicketRepository({
  firestore,
  FieldValue,
  uploadsDir,
  uploadsPublicPath: "uploads",
});
