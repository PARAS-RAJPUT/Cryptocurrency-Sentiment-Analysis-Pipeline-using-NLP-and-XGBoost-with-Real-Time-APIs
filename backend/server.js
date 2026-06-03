require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { connect }    = require("./config/db");
const sentimentRoutes = require("./routes/sentimentRoutes");
const newsRoutes      = require("./routes/newsRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/sentiment", sentimentRoutes);
app.use("/api/feed",      newsRoutes);

app.use(notFound);
app.use(errorHandler);

(async () => {
  await connect();
  app.listen(PORT, () => {
    console.log(`✅ Express  → http://localhost:${PORT}`);
    console.log(`🤖 ML URL   → ${process.env.ML_URL || "http://ml:5001"}`);
  });
})();
