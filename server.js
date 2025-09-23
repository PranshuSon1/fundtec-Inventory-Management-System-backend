// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('basic-auth');
const productService = require('./services/productService');
const inventoryService = require('./services/inventoryService');
const salesService = require('./services/salesService');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
app.use(bodyParser.json());

// simple basic auth middleware
function auth(req, res, next) {
  const user = basicAuth(req);
  const u = process.env.BASIC_AUTH_USER || 'admin';
  const p = process.env.BASIC_AUTH_PASS || 'changeme';
  if (!user || user.name !== u || user.pass !== p) {
    res.set('WWW-Authenticate', 'Basic realm="Inventory"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// public health
app.get('/health', (req, res) => res.json({ ok: true }));

// protected dashboard endpoints
app.get('/api/products', auth, async (req, res) => {
  const products = await productService.listProducts();
  res.json(products);
});

app.get('/api/batches/:productId', auth, async (req, res) => {
  const { productId } = req.params;
  const rows = await db.query(`SELECT * FROM inventory_batches WHERE product_id=$1 ORDER BY timestamp ASC`, [productId]);
  res.json(rows.rows);
});

app.get('/api/sales/:productId', auth, async (req, res) => {
  const { productId } = req.params;
  const rows = await db.query(`SELECT s.*, COALESCE(json_agg(json_build_object('batch_id', sli.batch_id, 'quantity', sli.quantity, 'unit_cost', sli.unit_cost)) FILTER (WHERE sli.id IS NOT NULL), '[]') AS line_items FROM sales s LEFT JOIN sale_line_items sli ON sli.sale_id = s.id WHERE s.product_id=$1 GROUP BY s.id ORDER BY s.timestamp DESC`, [productId]);
  res.json(rows.rows);
});

// API to push an event via server (convenience)
app.post('/api/events', auth, async (req, res) => {
  // this endpoint simply writes to DB as if event consumed (useful if Kafka not available)
  try {
    const { product_id, event_type, quantity, unit_price, timestamp } = req.body;
    if (!product_id || !event_type || !quantity || !timestamp) {
      return res.status(400).json({error: 'invalid payload'});
    }
    await productService.upsertProduct(product_id);
    if (event_type === 'purchase') {
      const b = await inventoryService.createBatch({product_id, quantity, unit_price, timestamp});
      return res.json({ok: true, batch: b});
    } else if (event_type === 'sale') {
      const sale = await require('./services/fifoService').processSale({product_id, quantity, timestamp});
      return res.json({ok: true, sale});
    } else {
      return res.status(400).json({ error: 'unknown event_type' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
