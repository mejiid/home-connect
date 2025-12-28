import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSessionWithRole } from "@/lib/session";
import { ADMIN_ROLE, AGENT_ROLE } from "@/lib/roles";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set(["Available", "Sold", "Leased"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await getSessionWithRole(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== ADMIN_ROLE && session.role !== AGENT_ROLE) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as
      | { status?: unknown }
      | null;

    const nextStatus = typeof body?.status === "string" ? body.status.trim() : "";
    if (!ALLOWED_STATUSES.has(nextStatus)) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Allowed: Available, Sold, Leased.",
        },
        { status: 400 }
      );
    }

    const existing = db
      .prepare('SELECT agentId FROM "properties" WHERE id = ?')
      .get(id) as { agentId?: string | null } | undefined;

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (session.role === AGENT_ROLE) {
      if (!existing.agentId || existing.agentId !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE "properties" SET status = ?, updatedAt = ? WHERE id = ?').run(
      nextStatus,
      now,
      id
    );

    return NextResponse.json({ success: true, id, status: nextStatus });
  } catch (error) {
    console.error("Failed to update property status:", error);
    return NextResponse.json(
      { error: "Failed to update property status" },
      { status: 500 }
    );
  }
}
