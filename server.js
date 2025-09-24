// server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const basicAuth = require("basic-auth");
const productService = require("./services/productService");
const inventoryService = require("./services/inventoryService");
// const salesService = require("./services/salesService")
const fifoService = require("./services/fifoService");
const { initDB, sequelize } = require("./sequelize");
const { Product, InventoryBatch, Sale, SaleLineItem } = require("./models");

const app = express();
const PORT = process.env.PORT || 4000;
app.use(bodyParser.json());

(async () => {
  await initDB();
  await sequelize.sync({ alter: true });
  // use { force: true } only in dev
  console.log("✅ Database synced");
})();

// simple basic auth middleware
function auth(req, res, next) {
  const user = basicAuth(req);
  const u = process.env.BASIC_AUTH_USER || "admin";
  const p = process.env.BASIC_AUTH_PASS || "changeme";
  if (!user || user.name !== u || user.pass !== p) {
    res.set("WWW-Authenticate", 'Basic realm="Inventory"');
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// public health
app.get("/health", (req, res) => res.json({ ok: true }));

// protected dashboard endpoints
app.get("/api/products", auth, async (req, res) => {
  const products = await productService.listProducts();
  res.json(products);
});

app.get("/api/batches/:productId", auth, async (req, res) => {
  const { productId } = req.params;
  const rows = await InventoryBatch.findAll({
    where: { product_id: productId },
    order: [
      ["timestamp", "ASC"],
      ["created_at", "ASC"],
    ],
  });
  res.json(rows);
});

app.get("/api/sales/:productId", auth, async (req, res) => {
  const { productId } = req.params;
  const sales = await Sale.findAll({
    where: { product_id: productId },
    include: [{ model: SaleLineItem }],
    order: [["timestamp", "DESC"]],
  });
  res.json(sales);
});

// API to push an event via server (convenience)
app.post("/api/events", auth, async (req, res) => {
  // this endpoint simply writes to DB as if event consumed (useful if Kafka not available)
  try {
    const { product_id, event_type, quantity, unit_price, timestamp } =
      req.body;

    if (!product_id || !event_type || !quantity || !timestamp) {
      return res.status(400).json({ error: "invalid payload" });
    }

    await productService.upsertProduct(product_id);

    if (event_type === "purchase") {
      const batch = await inventoryService.createBatch({
        product_id,
        quantity,
        unit_price,
        timestamp,
      });
      return res.json({ ok: true, batch });
    } else if (event_type === "sale") {
      const sale = await fifoService.processSale({
        product_id,
        quantity,
        timestamp,
      });
      return res.json({ ok: true, sale });
    } else {
      return res.status(400).json({ error: "unknown event_type" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
