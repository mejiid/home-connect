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

    const listingsRow = db
      .prepare(
        'SELECT COUNT(*) as c FROM "properties" WHERE "agentId" = ? AND status = ?'
      )
      .get(session.userId, "Available") as { c: number };

    const sellClientsRow = db
      .prepare(
        'SELECT COUNT(*) as c FROM "sell_submission" WHERE status = ? AND "statusUpdatedByUserId" = ?'
      )
      .get("accepted", session.userId) as { c: number };

    const lessorClientsRow = db
      .prepare(
        'SELECT COUNT(*) as c FROM "lessor_submission" WHERE status = ? AND "statusUpdatedByUserId" = ?'
      )
      .get("accepted", session.userId) as { c: number };

    const activeListings = Number(listingsRow?.c ?? 0);
    const clients = Number(sellClientsRow?.c ?? 0) + Number(lessorClientsRow?.c ?? 0);

    return NextResponse.json({ activeListings, clients });
  } catch (error) {
    console.error("Failed to fetch agent stats:", error);
    return NextResponse.json({ error: "Failed to fetch agent stats" }, { status: 500 });
  }
}
