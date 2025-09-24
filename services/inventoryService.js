// services/inventoryService.js
const { InventoryBatch } = require('../models');

async function createBatch({ product_id, quantity, unit_price, timestamp }) {
  return await InventoryBatch.create({
    product_id,
    quantity,
    remaining_quantity: quantity,
    unit_price,
    timestamp
  });
}

async function getOldestAvailableBatches(product_id, transaction) {
  return await InventoryBatch.findAll({
    where: {
      product_id,
      remaining_quantity: { [require('sequelize').Op.gt]: 0 }
    },
    order: [['timestamp', 'ASC'], ['created_at', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE // ensures row-level lock for FIFO
  });
}

async function decrementBatchRemaining(batch, decrement, transaction) {
  batch.remaining_quantity -= decrement;
  await batch.save({ transaction });
}

module.exports = { createBatch, getOldestAvailableBatches, decrementBatchRemaining };
