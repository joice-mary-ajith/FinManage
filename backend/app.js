require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./connection");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/v1/auth", require("./routes/authRoute"));
app.use("/api/v1/accounts", require("./routes/accountRoute"));
app.use("/api/v1/categories", require("./routes/categoryRoute"));
app.use("/api/v1/transactions", require("./routes/transactionRoute"));
app.use("/api/v1/analytics", require("./routes/analyticsRoute"));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  connectDB().then(() =>
    app.listen(PORT, () => console.log(`Server running on ${PORT}`))
  );
}
module.exports = app;