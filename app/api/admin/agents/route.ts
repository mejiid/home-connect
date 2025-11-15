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

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const user = db
      .prepare(
        'SELECT id, email, name, role FROM "user" WHERE lower(email) = lower(?)'
      )
      .get(email) as
      | { id: string; email: string; name: string; role?: string | null }
      | undefined;

    if (!user) {
      return NextResponse.json(
        { message: "No user found for that email" },
        { status: 404 }
      );
    }

    const currentRole = normalizeRole(user.role ?? DEFAULT_ROLE);

    if (currentRole === ADMIN_ROLE) {
      return NextResponse.json(
        { message: "Administrators cannot be converted to agents" },
        { status: 400 }
      );
    }

    if (currentRole === AGENT_ROLE) {
      return NextResponse.json(
        { message: "User is already an agent" },
        { status: 200 }
      );
    }

    db.prepare(
      'UPDATE "user" SET role = ?, updatedAt = datetime("now") WHERE id = ?'
    ).run(AGENT_ROLE, user.id);

    return NextResponse.json({
      message: `${user.email} is now an agent`,
      agent: {
        ...user,
        role: AGENT_ROLE,
      },
    });
  } catch (error) {
    console.error("Failed to assign agent role", error);
    return NextResponse.json(
      { message: "Failed to assign agent role" },
      { status: 500 }
    );
  }
}
