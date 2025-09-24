// sequelize.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // set true for SQL logs
});

async function initDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
  } catch (err) {
    console.error('❌ Unable to connect to DB:', err);
    process.exit(1);
  }
}

module.exports = { sequelize, initDB };
