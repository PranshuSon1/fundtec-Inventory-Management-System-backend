// services/productService.js
const { Product, InventoryBatch } = require('../models');
const { Sequelize } = require('sequelize');

async function upsertProduct(productId, name = null) {
  await Product.upsert({ id: productId, name });
}

async function listProducts() {
  const products = await Product.findAll({
    include: [{
      model: InventoryBatch,
      attributes: []
    }],
    attributes: [
      'id',
      'name',
      [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('InventoryBatches.remaining_quantity')), 0), 'current_quantity'],
      [Sequelize.fn('COALESCE', Sequelize.fn('SUM',
        Sequelize.literal('"InventoryBatches"."remaining_quantity" * "InventoryBatches"."unit_price"')
      ), 0), 'total_inventory_cost']
    ],
    group: ['Product.id'],
    order: [['id', 'ASC']]
  });

  return products.map(p => {
    const qty = Number(p.get('current_quantity'));
    const cost = Number(p.get('total_inventory_cost'));
    return {
      id: p.id,
      name: p.name,
      current_quantity: qty,
      total_inventory_cost: cost,
      avg_cost_per_unit: qty > 0 ? cost / qty : 0
    };
  });
}

module.exports = { upsertProduct, listProducts };
