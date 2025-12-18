import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import { getSessionWithRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getSessionWithRole(request);
    if (!session) {
      console.warn("ImageKit auth: Unauthorized request");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload files." },
        { status: 401 }
      );
    }

    const publicKey = process.env.IMAGEKIT_PUBLIC;
    const privateKey = process.env.IMAGEKIT_PRIVATE;
    const urlEndpoint = process.env.IMAGEKIT_URL;

    // Check for missing environment variables
    const missingVars: string[] = [];
    if (!publicKey) missingVars.push("IMAGEKIT_PUBLIC");
    if (!privateKey) missingVars.push("IMAGEKIT_PRIVATE");
    if (!urlEndpoint) missingVars.push("IMAGEKIT_URL");

    if (missingVars.length > 0) {
      console.error(
        "ImageKit auth: Missing environment variables:",
        missingVars
      );
      return NextResponse.json(
        {
          error: "ImageKit configuration is missing",
          details:
            process.env.NODE_ENV === "development"
              ? `Missing: ${missingVars.join(", ")}`
              : undefined,
        },
        { status: 500 }
      );
    }

    // TS narrowing: ensure these are definitely strings after the missing-vars check.
    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        {
          error: "ImageKit configuration is missing",
        },
        { status: 500 }
      );
    }

    // Initialize ImageKit
    let imagekit: ImageKit;
    try {
      imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
      });
    } catch (initError) {
      console.error("ImageKit initialization error:", initError);
      return NextResponse.json(
        {
          error: "Failed to initialize ImageKit",
          details:
            process.env.NODE_ENV === "development"
              ? initError instanceof Error
                ? initError.message
                : String(initError)
              : undefined,
        },
        { status: 500 }
      );
    }

    // Generate authentication parameters
    let authenticationParameters;
    try {
      authenticationParameters = imagekit.getAuthenticationParameters();
    } catch (authError) {
      console.error("ImageKit auth parameter generation error:", authError);
      return NextResponse.json(
        {
          error: "Failed to generate authentication parameters",
          details:
            process.env.NODE_ENV === "development"
              ? authError instanceof Error
                ? authError.message
                : String(authError)
              : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...authenticationParameters,
      publicKey: publicKey!,
    });
  } catch (error) {
    console.error("ImageKit auth: Unexpected error:", {
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
