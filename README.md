# Inventory Management (FIFO) — Backend (Node.js)

## Overview
Node.js + Express backend that integrates with Kafka to ingest `inventory-events` and stores data in PostgreSQL. Implements FIFO costing when processing sales.

## Requirements
- Node 18+
- PostgreSQL
- Kafka (or Redpanda / Confluent Cloud)
- npm

## Setup
1. Clone repo
2. Create `.env` from `.env.example`
3. Create Postgres DB and run `sql/schema.sql`
4. Install deps:
   npm install

## Running locally
- Start Kafka locally (or point to managed brokers in `.env`)
- Start consumer:
  npm run kafka-consumer
- Run the server:
  npm run dev
- Run simulator to emit events:
  npm run kafka-sim

## Quick test (without Kafka)
- Use POST /api/events (Basic Auth required) to create purchase/sale events manually.

## APIs (protected by Basic Auth)
- GET /api/products
- GET /api/batches/:productId
- GET /api/sales/:productId
- POST /api/events {product_id, event_type, quantity, unit_price?, timestamp}

## FIFO logic
- On sale: lock oldest batches (FOR UPDATE), consume quantities from oldest batches first, create `sales` and `sale_line_items`, commit transaction. If insufficient stock, rollback.

## Deliverables you can provide
- Live backend URL: deploy server + consumer (e.g., Railway / Render)
- Kafka simulator script (kafka/kafkaProducerSimulator.js)
- README (this file)
- Notes on deployment: configure DB + Kafka connection strings in env vars, run consumer and server on the platform.

