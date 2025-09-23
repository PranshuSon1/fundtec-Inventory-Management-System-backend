// kafka/kafkaProducerSimulator.js
require('dotenv').config();
const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'inventory-producer',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const topic = process.env.KAFKA_TOPIC || 'inventory-events';
const producer = kafka.producer();

const productIds = ['PRD001','PRD002','PRD003'];

function randomInt(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

async function sendRandomEvent() {
  const product_id = productIds[randomInt(0, productIds.length-1)];
  const isPurchase = Math.random() < 0.6; // more purchases initially
  const timestamp = new Date().toISOString();

  let event;
  if (isPurchase) {
    event = {
      product_id,
      event_type: 'purchase',
      quantity: randomInt(5, 100),
      unit_price: parseFloat((randomInt(50, 500) + Math.random()).toFixed(2)),
      timestamp
    };
  } else {
    event = {
      product_id,
      event_type: 'sale',
      quantity: randomInt(1, 20),
      timestamp
    };
  }

  await producer.send({
    topic,
    messages: [{ key: uuidv4(), value: JSON.stringify(event) }]
  });

  console.log('Sent event:', event);
}

async function run() {
  await producer.connect();
  console.log('Producer connected');
  // send a batch of events
  for (let i=0;i<10;i++){
    await sendRandomEvent();
    await new Promise(r => setTimeout(r, 300)); // small delay
  }
  // optionally keep running and send periodically:
  // setInterval(sendRandomEvent, 5000);
  await producer.disconnect();
  console.log('Producer disconnected');
}

run().catch(e => { console.error(e); process.exit(1); });
