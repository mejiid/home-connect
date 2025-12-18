import Database from "better-sqlite3";

const db = new Database("./sqlite.db");

function ensurePropertiesSchema() {
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

	const columns = db.prepare("PRAGMA table_info(properties)").all() as Array<{ name: string }>;
	const hasListingType = columns.some((col) => col.name === "listingType");
	if (!hasListingType) {
		db.exec("ALTER TABLE properties ADD COLUMN listingType TEXT NOT NULL DEFAULT 'rent'");
	}
}

ensurePropertiesSchema();

export default db;
