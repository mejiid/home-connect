import { NextResponse } from "next/server";

import db from "@/lib/db";
import { ADMIN_ROLE, DEFAULT_ROLE, normalizeRole } from "@/lib/roles";
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const adminSession = await ensureAdmin(request);

  if (!adminSession) {
    return unauthorizedResponse;
  }

  const id = params.id;

  if (!id) {
    return NextResponse.json(
      { message: "User id is required" },
      { status: 400 }
    );
  }

  const user = db
    .prepare('SELECT id, email, name, role FROM "user" WHERE id = ?')
    .get(id) as
    | { id: string; email: string; name: string; role?: string | null }
    | undefined;

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const currentRole = normalizeRole(user.role ?? DEFAULT_ROLE);

  if (currentRole === ADMIN_ROLE) {
    return NextResponse.json(
      { message: "Administrators cannot be downgraded" },
      { status: 400 }
    );
  }

  if (currentRole !== DEFAULT_ROLE) {
    const now = new Date().toISOString();
    db.prepare('UPDATE "user" SET role = ?, updatedAt = ? WHERE id = ?').run(
      DEFAULT_ROLE,
      now,
      id
    );

    return NextResponse.json({
      message: `${user.email} is no longer an agent`,
    });
  }

  return NextResponse.json(
    { message: "User is not currently an agent" },
    { status: 200 }
  );
}
