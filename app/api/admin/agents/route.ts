import { NextResponse } from "next/server";

import db from "@/lib/db";
import {
  ADMIN_ROLE,
  AGENT_ROLE,
  DEFAULT_ROLE,
  normalizeRole,
} from "@/lib/roles";
import { getSessionWithRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const unauthorizedResponse = NextResponse.json(
  { message: "Not authorized" },
  { status: 403 }
);

const ensureAdmin = async (request: Request) => {
  const session = await getSessionWithRole(request);

  if (!session || session.role !== ADMIN_ROLE) {
    return null;
  }

  return session;
};

export async function GET(request: Request) {
  const adminSession = await ensureAdmin(request);

  if (!adminSession) {
    return unauthorizedResponse;
  }

  const agents = db
    .prepare(
      'SELECT id, email, name, role, createdAt, updatedAt FROM "user" WHERE lower(role) = lower(?) ORDER BY datetime(createdAt) DESC'
    )
    .all(AGENT_ROLE) as {
    id: string;
    email: string;
    name: string;
    role: string | null;
    createdAt: string;
    updatedAt: string;
  }[];

  return NextResponse.json({ agents });
}

export async function POST(request: Request) {
  const adminSession = await ensureAdmin(request);

  if (!adminSession) {
    return unauthorizedResponse;
  }

  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    // Validate email is provided
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Check if user exists in database
    const user = db
      .prepare(
        'SELECT id, email, name, role FROM "user" WHERE lower(email) = lower(?)'
      )
      .get(email) as
      | { id: string; email: string; name: string; role?: string | null }
      | undefined;

    // If user doesn't exist, return error
    if (!user) {
      return NextResponse.json(
        { message: `No user found with email: ${email}` },
        { status: 404 }
      );
    }

    // Get current role (normalize to handle null/undefined)
    const currentRole = normalizeRole(user.role ?? DEFAULT_ROLE);

    // Prevent converting admins to agents
    if (currentRole === ADMIN_ROLE) {
      return NextResponse.json(
        { message: "Administrators cannot be converted to agents" },
        { status: 400 }
      );
    }

    // If already an agent, return success message
    if (currentRole === AGENT_ROLE) {
      return NextResponse.json(
        { message: `${user.email} is already an agent` },
        { status: 200 }
      );
    }

    // Update user role to agent
    const now = new Date().toISOString();
    const updateResult = db
      .prepare('UPDATE "user" SET role = ?, updatedAt = ? WHERE id = ?')
      .run(AGENT_ROLE, now, user.id);

    // Verify the update was successful
    if (updateResult.changes === 0) {
      console.error("Failed to update user role", { userId: user.id, email });
      return NextResponse.json(
        { message: "Failed to update user role. Please try again." },
        { status: 500 }
      );
    }

    console.log("Agent role assigned successfully", {
      userId: user.id,
      email: user.email,
      previousRole: currentRole,
      newRole: AGENT_ROLE,
    });

    return NextResponse.json({
      message: `${user.email} is now an agent`,
      agent: {
        ...user,
        role: AGENT_ROLE,
      },
    });
  } catch (error) {
    console.error("Failed to assign agent role", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        message: "Failed to assign agent role. Please try again.",
        error:
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
