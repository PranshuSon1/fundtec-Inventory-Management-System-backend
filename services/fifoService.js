// services/fifoService.js
const { sequelize } = require('../sequelize');
const inventoryService = require('./inventoryService');
const salesService = require('./salesService');

async function processSale({ product_id, quantity, timestamp }) {
  if (quantity <= 0) throw new Error('Quantity must be > 0');

  return await sequelize.transaction(async (t) => {
    const batches = await inventoryService.getOldestAvailableBatches(product_id, t);

    let remainingToConsume = quantity;
    const lineItems = [];

    for (const batch of batches) {
      if (remainingToConsume <= 0) break;
      const take = Math.min(batch.remaining_quantity, remainingToConsume);

      await inventoryService.decrementBatchRemaining(batch, take, t);

      lineItems.push({
        batch_id: batch.id,
        quantity: take,
        unit_cost: batch.unit_price
      });

      remainingToConsume -= take;
    }

    if (remainingToConsume > 0) {
      throw new Error('Insufficient stock to process sale');
    }

    const total_cost = lineItems.reduce((s, li) => s + li.quantity * parseFloat(li.unit_cost), 0);

    const sale = await salesService.createSale(
      { product_id, quantity, total_cost, timestamp, transaction: t },
    );

    for (const li of lineItems) {
      await salesService.addSaleLineItem({ sale_id: sale.id, ...li, transaction: t });
    }

    return { ...sale.get({ plain: true }), line_items: lineItems };
  });
}

module.exports = { processSale };
