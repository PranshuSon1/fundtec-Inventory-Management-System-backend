// services/fifoService.js
const inventoryService = require('./inventoryService');
const salesService = require('./salesService');
const db = require('../db');

async function processSale({product_id, quantity, timestamp}) {
  if (quantity <= 0) throw new Error('Quantity must be > 0');

  // Run in a transaction to ensure consistency
  return await db.pool.connect().then(async client => {
    try {
      await client.query('BEGIN');

      // select batches FOR UPDATE to lock them
      const batchesRes = await client.query(
        `SELECT * FROM inventory_batches WHERE product_id=$1 AND remaining_quantity>0 ORDER BY timestamp ASC, created_at ASC FOR UPDATE`,
        [product_id]
      );
      let remainingToConsume = quantity;
      const lineItems = [];

      for (const b of batchesRes.rows) {
        if (remainingToConsume <= 0) break;
        const take = Math.min(b.remaining_quantity, remainingToConsume);
        // Decrement
        await client.query(
          `UPDATE inventory_batches SET remaining_quantity = remaining_quantity - $1 WHERE id = $2`,
          [take, b.id]
        );
        lineItems.push({batch_id: b.id, quantity: take, unit_cost: b.unit_price});
        remainingToConsume -= take;
      }

      if (remainingToConsume > 0) {
        // Not enough stock — roll back
        await client.query('ROLLBACK');
        throw new Error('Insufficient stock to process sale');
      }

      // compute total cost
      const total_cost = lineItems.reduce((s, li) => s + (li.quantity * Number(li.unit_cost)), 0);

      // create sale
      const saleRes = await client.query(
        `INSERT INTO sales(product_id, quantity, total_cost, timestamp) VALUES($1,$2,$3,$4) RETURNING *`,
        [product_id, quantity, total_cost, timestamp]
      );
      const sale = saleRes.rows[0];

      // create sale line items
      for (const li of lineItems) {
        await client.query(
          `INSERT INTO sale_line_items(sale_id, batch_id, quantity, unit_cost) VALUES($1,$2,$3,$4)`,
          [sale.id, li.batch_id, li.quantity, li.unit_cost]
        );
      }

      await client.query('COMMIT');

      // Return sale + line items
      sale.line_items = lineItems;
      return sale;
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch(e) {}
      throw err;
    } finally {
      client.release();
    }
  });
}

module.exports = { processSale };
