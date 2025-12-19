import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/session";
import db from "@/lib/db";
import { ADMIN_ROLE, AGENT_ROLE } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

    // Get sell submissions with user info
    const sellSubmissions = db
      .prepare(
        `SELECT s.id, s."userId", s."fullName", s."phoneNumber", s.woreda, 
         s.kebele, s.village, s."identityDocumentUrl", s."homeMapUrl", 
         s.status, s."createdAt", s."updatedAt",
         s."statusUpdatedByUserId", s."statusUpdatedAt",
         u.email, u.name as "userName",
         reviewer.email as "statusUpdatedByEmail"
         FROM "sell_submission" s
         JOIN "user" u ON s."userId" = u.id
         LEFT JOIN "user" reviewer ON reviewer.id = s."statusUpdatedByUserId"
         ORDER BY s."createdAt" DESC`
      )
      .all() as Array<{
      id: string;
      userId: string;
      fullName: string;
      phoneNumber: string;
      woreda: string;
      kebele: string;
      village: string;
      identityDocumentUrl: string;
      homeMapUrl: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      statusUpdatedByUserId?: string | null;
      statusUpdatedAt?: string | null;
      email: string;
      userName: string | null;
      statusUpdatedByEmail?: string | null;
    }>;

    // Get lessor submissions with user info
    const lessorSubmissions = db
      .prepare(
        `SELECT s.id, s."userId", s."fullName", s."phoneNumber", s.woreda, 
         s.kebele, s.village, s."identityDocumentUrl", s."homeMapUrl", 
         s.status, s."createdAt", s."updatedAt",
         s."statusUpdatedByUserId", s."statusUpdatedAt",
         u.email, u.name as "userName",
         reviewer.email as "statusUpdatedByEmail"
         FROM "lessor_submission" s
         JOIN "user" u ON s."userId" = u.id
         LEFT JOIN "user" reviewer ON reviewer.id = s."statusUpdatedByUserId"
         ORDER BY s."createdAt" DESC`
      )
      .all() as Array<{
      id: string;
      userId: string;
      fullName: string;
      phoneNumber: string;
      woreda: string;
      kebele: string;
      village: string;
      identityDocumentUrl: string;
      homeMapUrl: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      statusUpdatedByUserId?: string | null;
      statusUpdatedAt?: string | null;
      email: string;
      userName: string | null;
      statusUpdatedByEmail?: string | null;
    }>;

    return NextResponse.json({
      sell: sellSubmissions.map((s) => ({ ...s, type: "sell" })),
      lessor: lessorSubmissions.map((s) => ({ ...s, type: "lessor" })),
    });
  } catch (error) {
    console.error("Failed to fetch all submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

