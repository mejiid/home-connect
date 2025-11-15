const Database = require("better-sqlite3");

const db = new Database("./sqlite.db");

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/check-role.js <email>");
  process.exit(1);
}

const row = db
  .prepare('SELECT role FROM "user" WHERE lower(email) = lower(?)')
  .get(email);

console.log(row ?? null);
