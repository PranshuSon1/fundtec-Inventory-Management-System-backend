// sequelize.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const UserName = process.env.UserName;
const Password = process.env.Password;
const Host = process.env.HOST;
const Port = process.env.DbPort;
const Database = process.env.Database;

const sequelize = new Sequelize(`postgres://${UserName}:${Password}@${Host}:${Port}/${Database}`, {
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
