// services/salesService.js
const { Sale, SaleLineItem } = require('../models');

async function createSale({ product_id, quantity, total_cost, timestamp, transaction }) {
  return await Sale.create({ product_id, quantity, total_cost, timestamp }, { transaction });
}

async function addSaleLineItem({ sale_id, batch_id, quantity, unit_cost, transaction }) {
  return await SaleLineItem.create({ sale_id, batch_id, quantity, unit_cost }, { transaction });
}

module.exports = { createSale, addSaleLineItem };
