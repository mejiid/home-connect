import { NextResponse } from "next/server";

import { DEFAULT_ROLE } from "@/lib/roles";
import { getSessionWithRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionWithRole(request);

    if (!session) {
      return NextResponse.json({ role: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        role: session.role ?? DEFAULT_ROLE,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to resolve user role:", error);
    return NextResponse.json({ role: null }, { status: 500 });
  }
}
