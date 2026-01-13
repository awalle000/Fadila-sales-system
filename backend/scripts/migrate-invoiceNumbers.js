// backend/scripts/migrate-invoiceNumbers.js
// Usage (preferred):
//   node backend/scripts/migrate-invoiceNumbers.js
// Or pass URI explicitly:
//   MONGODB_URI="mongodb+srv://..." node backend/scripts/migrate-invoiceNumbers.js
// Or with arg:
//   node backend/scripts/migrate-invoiceNumbers.js "mongodb+srv://..."
//
// This script will:
// - Connect to MongoDB (reading env vars or CLI arg)
// - Find invoices with missing/empty/null invoiceNumber
// - Generate unique invoiceNumber values and update documents
// - Print a report

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';

async function getMongoUri() {
  // CLI arg override
  const argUri = process.argv[2];
  if (argUri && argUri.startsWith('mongodb')) return argUri;

  // environment variables (common names)
  const candidates = [
    process.env.MONGODB_URI,
    process.env.MONGO_URI,
    process.env.DATABASE_URL,
    process.env.MONGO_URL
  ];

  for (const c of candidates) {
    if (c && c.startsWith('mongodb')) return c;
  }

  return null;
}

function generateInvoiceNumber(doc) {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 9000) + 1000; // 4-digit random
  const idSuffix = (doc._id && doc._id.toString().slice(-6)) || Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `INV-${ts}-${rand}-${idSuffix}`;
}

async function run() {
  try {
    const uri = await getMongoUri();
    if (!uri) {
      console.error('❌ MONGODB URI not found. I checked env vars: MONGODB_URI, MONGO_URI, DATABASE_URL, MONGO_URL.');
      console.error('Place your connection string in .env as MONGODB_URI or pass it as the first argument to the script.');
      console.error('Example: node backend/scripts/migrate-invoiceNumbers.js "mongodb+srv://user:pass@cluster/db"');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB.');

    const query = {
      $or: [
        { invoiceNumber: { $exists: false } },
        { invoiceNumber: null },
        { invoiceNumber: '' }
      ]
    };

    const docs = await Invoice.find(query).lean();
    console.log(`Found ${docs.length} invoice(s) without invoiceNumber.`);

    if (docs.length === 0) {
      console.log('Nothing to do. Exiting.');
      await mongoose.disconnect();
      process.exit(0);
    }

    let updated = 0;
    for (const doc of docs) {
      let candidate = generateInvoiceNumber(doc);
      let attempts = 0;
      let ok = false;

      while (!ok && attempts < 7) {
        // Check if already exists
        // eslint-disable-next-line no-await-in-loop
        const exists = await Invoice.findOne({ invoiceNumber: candidate }).lean();
        if (!exists) {
          ok = true;
        } else {
          candidate = generateInvoiceNumber(doc);
          attempts++;
        }
      }

      if (!ok) {
        console.warn(`⚠️  Could not find unique invoiceNumber for invoice ${doc._id}, skipping.`);
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      await Invoice.updateOne({ _id: doc._id }, { $set: { invoiceNumber: candidate } });
      console.log(`Updated invoice ${doc._id} -> invoiceNumber=${candidate}`);
      updated++;
    }

    console.log(`✅ Migration complete. Updated ${updated} invoice(s).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err && err.stack ? err.stack : err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

run();