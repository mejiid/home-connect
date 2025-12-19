// Temporary debug helper to inspect local sqlite.db
// Run: node scripts/debug-db.js

const Database = require("better-sqlite3");

const db = new Database("./sqlite.db");

const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sell_submission','lessor_submission','user','session')"
  )
  .all();

console.log("tables:", tables);

function safe(label, fn) {
  try {
    console.log(label, fn());
  } catch (e) {
    console.error(label, e && e.message ? e.message : e);
  }
}

safe("sell count:", () => db.prepare("SELECT COUNT(*) as c FROM sell_submission").get());
safe("lessor count:", () => db.prepare("SELECT COUNT(*) as c FROM lessor_submission").get());

safe("sell latest:", () =>
  db
    .prepare(
      "SELECT id, userId, status, createdAt FROM sell_submission ORDER BY createdAt DESC LIMIT 5"
    )
    .all()
);

safe("lessor latest:", () =>
  db
    .prepare(
      "SELECT id, userId, status, createdAt FROM lessor_submission ORDER BY createdAt DESC LIMIT 5"
    )
    .all()
);

safe("users latest:", () =>
  db
    .prepare(
      "SELECT id, email, role, createdAt FROM user ORDER BY createdAt DESC LIMIT 5"
    )
    .all()
);
