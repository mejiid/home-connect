import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/session";
import db from "@/lib/db";

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

    // Get sell submissions
    const sellSubmissions = db
      .prepare(
        `SELECT id, "fullName", "phoneNumber", woreda, kebele, village, 
         "identityDocumentUrl", "homeMapUrl", status, "createdAt", "updatedAt"
         FROM "sell_submission" 
         WHERE "userId" = ? 
         ORDER BY "createdAt" DESC`
      )
      .all(session.userId) as Array<{
      id: string;
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
    }>;

    // Get lessor submissions
    const lessorSubmissions = db
      .prepare(
        `SELECT id, "fullName", "phoneNumber", woreda, kebele, village, 
         "identityDocumentUrl", "homeMapUrl", status, "createdAt", "updatedAt"
         FROM "lessor_submission" 
         WHERE "userId" = ? 
         ORDER BY "createdAt" DESC`
      )
      .all(session.userId) as Array<{
      id: string;
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
    }>;

    return NextResponse.json({
      sell: sellSubmissions.map((s) => ({ ...s, type: "sell" })),
      lessor: lessorSubmissions.map((s) => ({ ...s, type: "lessor" })),
    });
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

