// models/InventoryBatch.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const InventoryBatch = sequelize.define('InventoryBatch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  remaining_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'inventory_batches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = InventoryBatch;
