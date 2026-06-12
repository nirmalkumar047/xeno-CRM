require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("./middleware/auth");

const customerRoutes = require("./routes/customers");
const segmentRoutes = require("./routes/segments");
const campaignRoutes = require("./routes/campaigns");
const receiptRoutes = require("./routes/receipts");
const analyticsRoutes = require("./routes/analytics");
const aiRoutes = require("./routes/ai");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
app.use(limiter);

// Public routes (no auth needed)
app.get("/health", (req, res) => res.json({ status: "ok", service: "biteloop-crm" }));
app.post("/api/receipts/callback", require("./controllers/receiptController").handleCallback);

// Protected routes
app.use("/api/customers", authMiddleware, customerRoutes);
app.use("/api/segments", authMiddleware, segmentRoutes);
app.use("/api/campaigns", authMiddleware, campaignRoutes);
app.use("/api/receipts", authMiddleware, receiptRoutes);
app.use("/api/analytics", authMiddleware, analyticsRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`BiteLoop CRM running on port ${PORT}`));
