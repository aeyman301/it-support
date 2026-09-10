require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");

const ticketsRouter = require("./routes/tickets");
const telegram = require("./services/telegram");
const email = require("./services/email");
const uploadsDir = require("./uploadDir");

fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3000;

// Some hosts (e.g. cPanel/Passenger app-under-a-subpath setups) forward the
// full request path unstripped instead of mounting the app at "/". Set
// BASE_PATH (e.g. "/IT/support") to match whatever URL prefix the host puts
// in front of this app. Leave it unset for a normal root deployment.
let basePath = process.env.BASE_PATH || "";
if (basePath && !basePath.startsWith("/")) basePath = `/${basePath}`;
if (basePath.endsWith("/")) basePath = basePath.slice(0, -1);

const router = express.Router();

router.use(express.json());
router.use(express.static(path.join(__dirname, "..", "public")));
router.use("/uploads", express.static(uploadsDir));

router.get("/api/config", (req, res) => {
  res.json({
    adminRequired: true,
    telegramEnabled: telegram.enabled,
    emailEnabled: email.enabled,
  });
});

router.use("/api/tickets", ticketsRouter);

router.get("/healthz", (req, res) => res.json({ ok: true }));

router.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.use(basePath, router);

app.listen(PORT, () => {
  console.log(`IT support ticket system listening on http://localhost:${PORT}${basePath || ""}`);
});
