// models/SaleLineItem.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const SaleLineItem = sequelize.define('SaleLineItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  }
}, {
  tableName: 'sale_line_items',
  timestamps: false
});

module.exports = SaleLineItem;
