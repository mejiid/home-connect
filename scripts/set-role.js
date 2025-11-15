const Database = require("better-sqlite3");

const db = new Database("./sqlite.db");

const [email, role] = process.argv.slice(2);

if (!email || !role) {
  console.error("Usage: node scripts/set-role.js <email> <role>");
  process.exit(1);
}

const info = db
  .prepare('UPDATE "user" SET role = ? WHERE lower(email) = lower(?)')
  .run(role.toLowerCase(), email);

console.log(info);
