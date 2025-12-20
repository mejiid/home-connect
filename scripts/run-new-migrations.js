const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const db = new Database("./sqlite.db");

// Migration 1: Add status to sell_submission
const migration1File = path.join(
  __dirname,
  "../better-auth_migrations/2025-01-16T00-00-00.000Z.sql"
);

// Migration 2: Create lessor_submission table
const migration2File = path.join(
  __dirname,
  "../better-auth_migrations/2025-01-16T01-00-00.000Z.sql"
);

// Migration 3: Add status audit columns (who updated status + when)
const migration3File = path.join(
  __dirname,
  "../better-auth_migrations/2025-12-19T00-00-00.000Z.sql"
);

// Migration 4: Add phone to user table
const migration4File = path.join(
  __dirname,
  "../better-auth_migrations/2025-12-19T12-00-00.000Z.sql"
);

try {
  // Check if status column exists
  const columns = db
    .prepare("PRAGMA table_info(sell_submission)")
    .all();
  const hasStatus = columns.some((col) => col.name === "status");

  if (!hasStatus) {
    const migration1SQL = fs.readFileSync(migration1File, "utf-8");
    db.exec(migration1SQL);
    console.log("✓ Migration 1 executed: Added status column to sell_submission");
  } else {
    console.log("✓ Migration 1: status column already exists");
  }

  // Check if lessor_submission table exists
  const tableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='lessor_submission'"
    )
    .get();

  if (!tableExists) {
    const migration2SQL = fs.readFileSync(migration2File, "utf-8");
    db.exec(migration2SQL);
    console.log("✓ Migration 2 executed: Created lessor_submission table");
  } else {
    console.log("✓ Migration 2: lessor_submission table already exists");
  }

  // Check if status audit columns exist (sell_submission)
  const sellColumns = db.prepare("PRAGMA table_info(sell_submission)").all();
  const hasSellAudit = sellColumns.some(
    (col) => col.name === "statusUpdatedByUserId"
  );

  // Check if status audit columns exist (lessor_submission) if the table exists
  const lessorTableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='lessor_submission'"
    )
    .get();
  const lessorColumns = lessorTableExists
    ? db.prepare("PRAGMA table_info(lessor_submission)").all()
    : [];
  const hasLessorAudit = lessorColumns.some(
    (col) => col.name === "statusUpdatedByUserId"
  );

  if (!hasSellAudit || (lessorTableExists && !hasLessorAudit)) {
    const migration3SQL = fs.readFileSync(migration3File, "utf-8");
    db.exec(migration3SQL);
    console.log(
      "✓ Migration 3 executed: Added status audit columns to submission tables"
    );
  } else {
    console.log("✓ Migration 3: status audit columns already exist");
  }

  // Check if phone column exists on user
  const userColumns = db.prepare("PRAGMA table_info(user)").all();
  const hasPhone = userColumns.some((col) => col.name === "phone");
  if (!hasPhone) {
    const migration4SQL = fs.readFileSync(migration4File, "utf-8");
    db.exec(migration4SQL);
    console.log("✓ Migration 4 executed: Added phone column to user table");
  } else {
    console.log("✓ Migration 4: phone column already exists");
  }
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}

