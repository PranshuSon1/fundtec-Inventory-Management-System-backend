// services/inventoryService.js
const db = require('../db');

async function createBatch({product_id, quantity, unit_price, timestamp}) {
  const res = await db.query(
    `INSERT INTO inventory_batches(product_id, quantity, remaining_quantity, unit_price, timestamp)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [product_id, quantity, quantity, unit_price, timestamp]
  );
  return res.rows[0];
}

async function getOldestAvailableBatches(product_id) {
  const res = await db.query(
    `SELECT * FROM inventory_batches WHERE product_id=$1 AND remaining_quantity>0 ORDER BY timestamp ASC, created_at ASC`,
    [product_id]
  );
  return res.rows;
}

async function decrementBatchRemaining(batch_id, decrement) {
  await db.query(
    `UPDATE inventory_batches SET remaining_quantity = remaining_quantity - $1 WHERE id = $2`,
    [decrement, batch_id]
  );
}

module.exports = { createBatch, getOldestAvailableBatches, decrementBatchRemaining };
