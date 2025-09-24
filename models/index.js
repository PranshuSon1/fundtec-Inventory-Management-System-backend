// models/index.js
const Product = require('./Products');
const InventoryBatch = require('./InventoryBatch');
const Sale = require('./Sale');
const SaleLineItem = require('./SaleLineItem');

// Associations
Product.hasMany(InventoryBatch, { foreignKey: 'product_id' });
InventoryBatch.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(Sale, { foreignKey: 'product_id' });
Sale.belongsTo(Product, { foreignKey: 'product_id' });

Sale.hasMany(SaleLineItem, { foreignKey: 'sale_id' });
SaleLineItem.belongsTo(Sale, { foreignKey: 'sale_id' });

InventoryBatch.hasMany(SaleLineItem, { foreignKey: 'batch_id' });
SaleLineItem.belongsTo(InventoryBatch, { foreignKey: 'batch_id' });

module.exports = { Product, InventoryBatch, Sale, SaleLineItem };
