import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSessionWithRole } from "@/lib/session";
import { AGENT_ROLE } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionWithRole(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== AGENT_ROLE) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const properties = db
      .prepare(
        `
        SELECT
          id,
          title,
          description,
          listingType,
          type,
          city,
          bedrooms,
          bathrooms,
          area,
          price,
          currency,
          images,
          status,
          createdAt,
          updatedAt,
          agentId
        FROM properties
        WHERE agentId = ? AND status = 'Available'
        ORDER BY datetime(createdAt) DESC
        LIMIT 50
      `
      )
      .all(session.userId);

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Failed to fetch agent properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent properties" },
      { status: 500 }
    );
  }
}
