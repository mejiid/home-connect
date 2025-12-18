import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import { getSessionWithRole } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSessionWithRole(request);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload files." },
        { status: 401 }
      );
    }

    const publicKey = process.env.IMAGEKIT_PUBLIC;
    const privateKey = process.env.IMAGEKIT_PRIVATE;
    const urlEndpoint = process.env.IMAGEKIT_URL;

    const missingVars: string[] = [];
    if (!publicKey) missingVars.push("IMAGEKIT_PUBLIC");
    if (!privateKey) missingVars.push("IMAGEKIT_PRIVATE");
    if (!urlEndpoint) missingVars.push("IMAGEKIT_URL");

    if (missingVars.length > 0) {
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

    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        { error: "ImageKit configuration is missing" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const fileName = formData.get("fileName");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing or invalid file" },
        { status: 400 }
      );
    }

    if (typeof fileName !== "string" || !fileName.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid fileName" },
        { status: 400 }
      );
    }

    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const uploadResult = await imagekit.upload({
      file: base64,
      fileName: fileName.trim(),
    });

    return NextResponse.json({
      url: uploadResult.url,
      fileId: uploadResult.fileId,
      name: uploadResult.name,
    });
  } catch (error) {
    console.error("ImageKit upload: Unexpected error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Upload failed",
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
