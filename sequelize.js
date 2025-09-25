// sequelize.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const UserName = process.env.DBUserName;
const Password = process.env.Password;
const Host = process.env.HOST;
const Port = process.env.DbPort;
const Database = process.env.Database;

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true, // This ensures SSL is required
      rejectUnauthorized: false // Set to true in production if you have a valid certificate
    } },
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
