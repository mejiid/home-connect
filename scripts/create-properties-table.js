const Database = require("better-sqlite3");
const db = new Database("sqlite.db");

console.log("Creating properties table...");

db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    listingType TEXT NOT NULL DEFAULT 'rent',
    type TEXT NOT NULL,
    city TEXT DEFAULT 'Harari',
    kebele TEXT,
    woreda TEXT,
    street TEXT,
    landmarks TEXT,
    ownerName TEXT NOT NULL,
    ownerPhone TEXT NOT NULL,
    ownerEmail TEXT,
    ownerId TEXT,
    ownerAltPhone TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    kitchens INTEGER,
    livingRooms INTEGER,
    floors INTEGER,
    area REAL,
    furnished BOOLEAN,
    water BOOLEAN,
    electricity TEXT,
    internet BOOLEAN,
    parking BOOLEAN,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'ETB',
    priceNegotiable BOOLEAN,
    condition TEXT,
    yearBuilt INTEGER,
    renovationStatus TEXT,
    images TEXT,
    status TEXT DEFAULT 'Available',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    agentId TEXT NOT NULL
  )
`);

// Idempotent upgrade for existing DBs that predate listingType
try {
  const cols = db.prepare("PRAGMA table_info(properties)").all();
  const hasListingType = cols.some((c) => c.name === "listingType");
  if (!hasListingType) {
    db.exec("ALTER TABLE properties ADD COLUMN listingType TEXT NOT NULL DEFAULT 'rent'");
    console.log("✓ Added listingType column to properties table");
  }
} catch (e) {
  console.warn("⚠ Could not verify/upgrade properties schema:", e.message || e);
}

console.log("Properties table created successfully.");
