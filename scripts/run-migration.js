const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const db = new Database("./sqlite.db");

// Read the migration file
const migrationFile = path.join(
  __dirname,
  "../better-auth_migrations/2025-01-15T00-00-00.000Z.sql"
);

if (!fs.existsSync(migrationFile)) {
  console.error("Migration file not found:", migrationFile);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationFile, "utf-8");

try {
  // Check if table already exists
  const tableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='sell_submission'"
    )
    .get();

  if (tableExists) {
    console.log("Table 'sell_submission' already exists. Skipping migration.");
    process.exit(0);
  }

  // Run the migration
  db.exec(migrationSQL);
  console.log("Migration executed successfully!");
  console.log("Table 'sell_submission' created.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}

