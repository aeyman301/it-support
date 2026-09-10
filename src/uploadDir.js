const path = require("path");

// Where ticket attachments are stored on local disk. Defaults to an "uploads"
// folder next to the app - override with UPLOAD_DIR if it should live elsewhere
// (e.g. a persistent path outside the deployed app root on cPanel).
const uploadDir = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(__dirname, "..", "uploads");

module.exports = uploadDir;
