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

const userHasPhoneColumn = () => {
  const columns = db.prepare('PRAGMA table_info("user")').all() as Array<{
    name: string;
  }>;
  return columns.some((column) => column.name === "phone");
};

const normalizePhoneDigits = (value: string) => value.replace(/\D/g, "");

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

  const includePhone = userHasPhoneColumn();

  const agents = db
    .prepare(
      includePhone
        ? 'SELECT id, email, name, phone, role, createdAt, updatedAt FROM "user" WHERE lower(role) = lower(?) ORDER BY datetime(createdAt) DESC'
        : 'SELECT id, email, name, role, createdAt, updatedAt FROM "user" WHERE lower(role) = lower(?) ORDER BY datetime(createdAt) DESC'
    )
    .all(AGENT_ROLE) as {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
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
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      phone?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const agentName = body.name?.trim();
    const agentPhone = body.phone?.trim();

    // Validate email is provided
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    if (!agentName) {
      return NextResponse.json(
        { message: "Agent name is required" },
        { status: 400 }
      );
    }

    if (!agentPhone) {
      return NextResponse.json(
        { message: "Agent phone number is required" },
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

    const phoneDigits = normalizePhoneDigits(agentPhone);
    if (phoneDigits.length < 7) {
      return NextResponse.json(
        { message: "Please provide a valid phone number" },
        { status: 400 }
      );
    }

    const includePhone = userHasPhoneColumn();
    if (!includePhone) {
      return NextResponse.json(
        {
          message:
            "Database is missing user.phone column. Run migrations then try again.",
        },
        { status: 500 }
      );
    }

    // Check if user exists in database
    const user = db
      .prepare(
        'SELECT id, email, name, phone, role FROM "user" WHERE lower(email) = lower(?)'
      )
      .get(email) as
      | {
          id: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: string | null;
        }
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

    const shouldUpdateRole = currentRole !== AGENT_ROLE;

    // Update user fields (role + name + phone)
    const now = new Date().toISOString();
    const updateResult = db
      .prepare(
        shouldUpdateRole
          ? 'UPDATE "user" SET role = ?, name = ?, phone = ?, updatedAt = ? WHERE id = ?'
          : 'UPDATE "user" SET name = ?, phone = ?, updatedAt = ? WHERE id = ?'
      )
      .run(
        ...(shouldUpdateRole
          ? [AGENT_ROLE, agentName, agentPhone, now, user.id]
          : [agentName, agentPhone, now, user.id])
      );

    // Verify the update was successful
    if (updateResult.changes === 0) {
      console.error("Failed to update user role", { userId: user.id, email });
      return NextResponse.json(
        { message: "Failed to update user role. Please try again." },
        { status: 500 }
      );
    }

    console.log("Agent updated successfully", {
      userId: user.id,
      email: user.email,
      previousRole: currentRole,
      newRole: shouldUpdateRole ? AGENT_ROLE : currentRole,
    });

    return NextResponse.json({
      message: shouldUpdateRole
        ? `${user.email} is now an agent`
        : `${user.email} agent details updated`,
      agent: {
        ...user,
        name: agentName,
        phone: agentPhone,
        role: shouldUpdateRole ? AGENT_ROLE : currentRole,
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
