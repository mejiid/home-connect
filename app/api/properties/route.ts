import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/session";
import db from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getSessionWithRole(request);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Allow admins and agents
    if (session.role !== "admin" && session.role !== "agent") {
        return NextResponse.json(
            { error: "Forbidden: Only admins and agents can add properties" },
            { status: 403 }
        );
    }

    const body = await request.json();
    const {
      title,
      description,
      listingType = "rent",
      type,
      city = "Harari",
      kebele,
      woreda,
      street,
      landmarks,
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerId,
      ownerAltPhone,
      bedrooms,
      bathrooms,
      kitchens,
      livingRooms,
      floors,
      area,
      furnished,
      water,
      electricity,
      internet,
      parking,
      price,
      currency = "ETB",
      priceNegotiable,
      condition,
      yearBuilt,
      renovationStatus,
      images,
    } = body;

    // Basic validation
    if (!title || !type || !ownerName || !ownerPhone || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (listingType !== "rent" && listingType !== "sell") {
      return NextResponse.json(
        { error: "Invalid listingType. Must be 'rent' or 'sell'." },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO properties (
        id, title, description, listingType, type, city, kebele, woreda, street, landmarks,
        ownerName, ownerPhone, ownerEmail, ownerId, ownerAltPhone,
        bedrooms, bathrooms, kitchens, livingRooms, floors, area,
        furnished, water, electricity, internet, parking,
        price, currency, priceNegotiable,
        condition, yearBuilt, renovationStatus,
        images, status, createdAt, updatedAt, agentId
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      title,
      description || null,
      listingType,
      type,
      city,
      kebele || null,
      woreda || null,
      street || null,
      landmarks || null,
      ownerName,
      ownerPhone,
      ownerEmail || null,
      ownerId || null,
      ownerAltPhone || null,
      bedrooms || null,
      bathrooms || null,
      kitchens || null,
      livingRooms || null,
      floors || null,
      area || null,
      furnished ? 1 : 0,
      water ? 1 : 0,
      electricity || null,
      internet ? 1 : 0,
      parking ? 1 : 0,
      price,
      currency,
      priceNegotiable ? 1 : 0,
      condition || null,
      yearBuilt || null,
      renovationStatus || null,
      JSON.stringify(images || []),
      "Available",
      now,
      now,
      session.userId
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to create property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
