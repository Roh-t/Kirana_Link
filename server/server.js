require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const productRoutes = require("./routes/products");
const uploadRoutes = require("./routes/upload");
const { rebuildIndex, startPeriodicRefresh } = require("./services/searchIndex");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => rebuildIndex())
  .then(() => {
    startPeriodicRefresh();
    app.listen(PORT, () => console.log(`[Server] running on http://localhost:${PORT}`));
  });
