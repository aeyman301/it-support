require("dotenv").config();
const path = require("path");
const express = require("express");

const ticketsRouter = require("./routes/tickets");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/config", (req, res) => {
  res.json({ adminRequired: true });
});

app.use("/api/tickets", ticketsRouter);

app.get("/healthz", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`IT support ticket system listening on http://localhost:${PORT}`);
});
