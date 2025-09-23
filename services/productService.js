// services/productService.js
const db = require('../db');

async function upsertProduct(productId, name = null) {
  await db.query(
    `INSERT INTO products(id, name) VALUES($1, $2)
     ON CONFLICT (id) DO UPDATE SET name = COALESCE(EXCLUDED.name, products.name)`,
    [productId, name]
  );
}

async function listProducts() {
  const res = await db.query(`SELECT p.*, 
    COALESCE(SUM(b.remaining_quantity),0) as current_quantity,
    COALESCE(SUM(b.remaining_quantity * b.unit_price),0) as total_inventory_cost
    FROM products p
    LEFT JOIN inventory_batches b ON b.product_id = p.id
    GROUP BY p.id ORDER BY p.id`);
  return res.rows.map(r => ({
    id: r.id,
    name: r.name,
    current_quantity: Number(r.current_quantity),
    total_inventory_cost: Number(r.total_inventory_cost),
    avg_cost_per_unit: r.current_quantity > 0 ? Number(r.total_inventory_cost) / Number(r.current_quantity) : 0
  }));
}

module.exports = { upsertProduct, listProducts };
