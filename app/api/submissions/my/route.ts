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

    if (process.env.NODE_ENV === "development") {
      try {
        const dbInfo = db.pragma("database_list") as Array<{ file?: string }>;
        const sellCount = db
          .prepare('SELECT COUNT(*) as c FROM "sell_submission" WHERE "userId" = ?')
          .get(session.userId) as { c: number };
        const lessorCount = db
          .prepare('SELECT COUNT(*) as c FROM "lessor_submission" WHERE "userId" = ?')
          .get(session.userId) as { c: number };

        console.log("/api/submissions/my debug", {
          userId: session.userId,
          dbFile: dbInfo?.[0]?.file,
          sellCount: sellCount?.c,
          lessorCount: lessorCount?.c,
        });
      } catch (debugError) {
        console.warn("/api/submissions/my debug failed", debugError);
      }
    }

    // Get sell submissions
    const sellSubmissions = db
      .prepare(
        `SELECT s.id, s."fullName", s."phoneNumber", s.woreda, s.kebele, s.village, 
         s."identityDocumentUrl", s."homeMapUrl", s.status, s."createdAt", s."updatedAt",
         s."statusUpdatedByUserId", s."statusUpdatedAt",
         reviewer.email as "statusUpdatedByEmail"
         FROM "sell_submission" s
         LEFT JOIN "user" reviewer ON reviewer.id = s."statusUpdatedByUserId"
         WHERE "userId" = ? 
        ORDER BY s."createdAt" DESC`
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
      statusUpdatedByUserId?: string | null;
      statusUpdatedAt?: string | null;
      statusUpdatedByEmail?: string | null;
    }>;

    // Get lessor submissions
    const lessorSubmissions = db
      .prepare(
        `SELECT s.id, s."fullName", s."phoneNumber", s.woreda, s.kebele, s.village, 
         s."identityDocumentUrl", s."homeMapUrl", s.status, s."createdAt", s."updatedAt",
         s."statusUpdatedByUserId", s."statusUpdatedAt",
         reviewer.email as "statusUpdatedByEmail"
         FROM "lessor_submission" s
         LEFT JOIN "user" reviewer ON reviewer.id = s."statusUpdatedByUserId"
         WHERE "userId" = ? 
        ORDER BY s."createdAt" DESC`
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
      statusUpdatedByUserId?: string | null;
      statusUpdatedAt?: string | null;
      statusUpdatedByEmail?: string | null;
    }>;

    const payload: Record<string, unknown> = {
      sell: sellSubmissions.map((s) => ({ ...s, type: "sell" })),
      lessor: lessorSubmissions.map((s) => ({ ...s, type: "lessor" })),
    };

    if (process.env.NODE_ENV === "development") {
      const dbInfo = db.pragma("database_list") as Array<{ file?: string }>;
      payload.debug = {
        userId: session.userId,
        dbFile: dbInfo?.[0]?.file,
        sellCount: sellSubmissions.length,
        lessorCount: lessorSubmissions.length,
      };
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch submissions",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

