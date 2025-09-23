// kafka/kafkaConsumer.js
require('dotenv').config();
const { Kafka } = require('kafkajs');
const db = require('../db');
const productService = require('../services/productService');
const inventoryService = require('../services/inventoryService');
const fifoService = require('../services/fifoService');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'inventory-client',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const topic = process.env.KAFKA_TOPIC || 'inventory-events';

async function runConsumer() {
  const consumer = kafka.consumer({ groupId: 'inventory-group' });
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });
  console.log('Kafka consumer connected, listening to', topic);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        console.log('Event received:', payload);

        const { product_id, event_type, quantity, unit_price, timestamp } = payload;
        if (!product_id || !event_type || !quantity || !timestamp) {
          console.error('Invalid event payload');
          return;
        }

        // Ensure product exists
        await productService.upsertProduct(product_id);

        if (event_type === 'purchase') {
          // create inventory batch
          await inventoryService.createBatch({ product_id, quantity, unit_price, timestamp });
          console.log('Purchase batch created');
        } else if (event_type === 'sale') {
          // process sale via FIFO logic
          try {
            const sale = await fifoService.processSale({ product_id, quantity, timestamp });
            console.log('Sale recorded', sale.id);
          } catch (err) {
            console.error('Sale processing error:', err.message);
            // depends on policy: you could push a failed event to another topic or store the failure
          }
        } else {
          console.error('Unknown event_type:', event_type);
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    }
  });
}

runConsumer().catch(err => {
  console.error('Consumer crashed', err);
  process.exit(1);
});
