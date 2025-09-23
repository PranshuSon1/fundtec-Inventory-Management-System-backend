// services/salesService.js
const db = require('../db');

async function createSale({product_id, quantity, total_cost, timestamp}) {
  const res = await db.query(
    `INSERT INTO sales(product_id, quantity, total_cost, timestamp) VALUES($1,$2,$3,$4) RETURNING *`,
    [product_id, quantity, total_cost, timestamp]
  );
  return res.rows[0];
}

async function addSaleLineItem({sale_id, batch_id, quantity, unit_cost}) {
  await db.query(
    `INSERT INTO sale_line_items(sale_id, batch_id, quantity, unit_cost) VALUES($1,$2,$3,$4)`,
    [sale_id, batch_id, quantity, unit_cost]
  );
}

module.exports = { createSale, addSaleLineItem };
