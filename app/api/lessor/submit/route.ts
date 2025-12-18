import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/session";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getSessionWithRole(request);
    if (!session) {
      console.warn("Lessor submit: Unauthorized request");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to submit a listing." },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Lessor submit: JSON parse error:", parseError);
      return NextResponse.json(
        {
          error: "Invalid request format",
          details:
            process.env.NODE_ENV === "development"
              ? parseError instanceof Error
                ? parseError.message
                : "Failed to parse JSON"
              : undefined,
        },
        { status: 400 }
      );
    }

    const {
      fullName,
      phoneNumber,
      woreda,
      kebele,
      village,
      identityDocumentUrl,
      homeMapUrl,
    } = body;

    // Validate required fields with specific messages
    const missingFields: string[] = [];
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      missingFields.push("fullName");
    }
    if (
      !phoneNumber ||
      typeof phoneNumber !== "string" ||
      !phoneNumber.trim()
    ) {
      missingFields.push("phoneNumber");
    }
    if (!woreda || typeof woreda !== "string" || !woreda.trim()) {
      missingFields.push("woreda");
    }
    if (!kebele || typeof kebele !== "string" || !kebele.trim()) {
      missingFields.push("kebele");
    }
    if (!village || typeof village !== "string" || !village.trim()) {
      missingFields.push("village");
    }
    if (
      !identityDocumentUrl ||
      typeof identityDocumentUrl !== "string" ||
      !identityDocumentUrl.trim()
    ) {
      missingFields.push("identityDocumentUrl");
    }
    if (
      !homeMapUrl ||
      typeof homeMapUrl !== "string" ||
      !homeMapUrl.trim()
    ) {
      missingFields.push("homeMapUrl");
    }

    if (missingFields.length > 0) {
      console.warn("Lessor submit: Missing required fields:", missingFields);
      return NextResponse.json(
        {
          error: "All fields are required",
          missingFields:
            process.env.NODE_ENV === "development" ? missingFields : undefined,
        },
        { status: 400 }
      );
    }

    // Validate URLs are from ImageKit
    if (
      typeof identityDocumentUrl !== "string" ||
      !identityDocumentUrl.includes("imagekit.io")
    ) {
      console.warn("Lessor submit: Invalid identity document URL");
      return NextResponse.json(
        {
          error: "Invalid identity document URL. Please upload a valid document.",
        },
        { status: 400 }
      );
    }

    if (
      typeof homeMapUrl !== "string" ||
      !homeMapUrl.includes("imagekit.io")
    ) {
      console.warn("Lessor submit: Invalid home map URL");
      return NextResponse.json(
        {
          error: "Invalid home map URL. Please upload a valid document.",
        },
        { status: 400 }
      );
    }

    // Check if table exists
    try {
      const tableCheck = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='lessor_submission'"
        )
        .get();

      if (!tableCheck) {
        console.error("Lessor submit: Table 'lessor_submission' does not exist");
        return NextResponse.json(
          {
            error: "Database configuration error",
            details:
              process.env.NODE_ENV === "development"
                ? "Table 'lessor_submission' not found. Please run migrations."
                : undefined,
          },
          { status: 500 }
        );
      }
    } catch (tableError) {
      console.error("Lessor submit: Database table check error:", tableError);
      return NextResponse.json(
        {
          error: "Database error",
          details:
            process.env.NODE_ENV === "development"
              ? tableError instanceof Error
                ? tableError.message
                : String(tableError)
              : undefined,
        },
        { status: 500 }
      );
    }

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Insert into database
    try {
      const insertSubmission = db.prepare(
        `INSERT INTO "lessor_submission" 
         (id, "userId", "fullName", "phoneNumber", woreda, kebele, village, "identityDocumentUrl", "homeMapUrl", status, "createdAt", "updatedAt") 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      insertSubmission.run(
        id,
        session.userId,
        fullName.trim(),
        phoneNumber.trim(),
        woreda.trim(),
        kebele.trim(),
        village.trim(),
        identityDocumentUrl.trim(),
        homeMapUrl.trim(),
        "pending",
        timestamp,
        timestamp
      );
    } catch (dbError: any) {
      console.error("Lessor submit: Database insert error:", {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        code: dbError?.code,
        userId: session.userId,
      });

      // Handle specific database errors
      if (dbError?.code === "SQLITE_CONSTRAINT") {
        return NextResponse.json(
          {
            error: "Database constraint error",
            details:
              process.env.NODE_ENV === "development"
                ? dbError.message
                : undefined,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to save submission",
          details:
            process.env.NODE_ENV === "development"
              ? dbError instanceof Error
                ? dbError.message
                : String(dbError)
              : undefined,
        },
        { status: 500 }
      );
    }

    console.log("Lessor submit: Successfully created submission", {
      id,
      userId: session.userId,
    });

    return NextResponse.json(
      {
        message: "Submission created successfully",
        id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lessor submit: Unexpected error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "An unexpected error occurred",
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

