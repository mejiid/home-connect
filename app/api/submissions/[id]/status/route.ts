import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/session";
import db from "@/lib/db";
import { ADMIN_ROLE, AGENT_ROLE } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionWithRole(request);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or agent
    if (session.role !== ADMIN_ROLE && session.role !== AGENT_ROLE) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, type } = body;

    // Validate status
    if (!["pending", "accepted", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be pending, accepted, or rejected" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["sell", "lessor"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be sell or lessor" },
        { status: 400 }
      );
    }

    const tableName = type === "sell" ? "sell_submission" : "lessor_submission";
    const timestamp = new Date().toISOString();

    // Update status
    const updateStmt = db.prepare(
      `UPDATE "${tableName}" 
       SET status = ?, "updatedAt" = ? 
       WHERE id = ?`
    );

    const result = updateStmt.run(status, timestamp, id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Status updated successfully",
      id,
      status,
    });
  } catch (error) {
    console.error("Failed to update status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

