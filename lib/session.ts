import db from "./db";
import { auth } from "./auth";
import { DEFAULT_ROLE, normalizeRole, UserRole } from "./roles";

export type SessionWithRole = {
  userId: string;
  role: UserRole;
  session: {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: string | null;
    };
  };
};

type GetSessionResponse =
  | {
      data?: { user: { id: string; role?: string | null } } | null;
      error?: unknown;
    }
  | { user?: { id: string; role?: string | null } | null };

export const getSessionWithRole = async (
  request: Request
): Promise<SessionWithRole | null> => {
  try {
    const result = (await auth.api.getSession({
      headers: request.headers,
      asResponse: false,
    })) as GetSessionResponse | null;

    const sessionData =
      (result && "data" in result ? result.data : null) ??
      (result && "user" in result ? result : null);

    const sessionUser = sessionData?.user;
    const userId = sessionUser?.id;

    if (!userId) {
      return null;
    }

    const directRole = sessionUser?.role;

    let resolvedRole = normalizeRole(directRole ?? DEFAULT_ROLE);

    if (!directRole || resolvedRole === DEFAULT_ROLE) {
      const row = db
        .prepare('SELECT role FROM "user" WHERE id = ?')
        .get(userId) as { role?: string | null } | undefined;

      resolvedRole = normalizeRole(row?.role ?? resolvedRole);
    }

    return {
      userId,
      role: resolvedRole,
      session: sessionData as SessionWithRole["session"],
    };
  } catch (error) {
    console.error("Failed to load session role", error);
    return null;
  }
};
