require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./connection");

// Fail at start-up (with a clear message) instead of failing on the first login.
const missing = ["MONGO_URI", "JWT_SECRET"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const app = express();

// CORS: only the deployed frontend(s) listed in CLIENT_URL may call this API from a browser.
// CLIENT_URL can hold several origins separated by commas, e.g. https://finmanage.example.com,http://localhost:5173
// Requests with no Origin header (curl, Thunder Client, health checks) are not browser requests and are allowed.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  })
);
app.use(express.json());

app.get("/api/v1/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/v1/auth", require("./routes/authRoute"));
app.use("/api/v1/accounts", require("./routes/accountRoute"));
app.use("/api/v1/categories", require("./routes/categoryRoute"));
app.use("/api/v1/transactions", require("./routes/transactionRoute"));
app.use("/api/v1/analytics", require("./routes/analyticsRoute"));
app.use("/api/v1/budgets", require("./routes/budgetRoute"));
app.use("/api/v1/admin", require("./routes/adminRoute"));

// Unknown URL -> JSON 404 (instead of Express's default HTML page)
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Last-resort error handler. Typical case: the request body is not valid JSON.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON in request body" });
  console.error(err);
  res.status(err.status || 500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  connectDB().then(() =>
    app.listen(PORT, () => console.log(`Server running on ${PORT}`))
  );
}
module.exports = app;