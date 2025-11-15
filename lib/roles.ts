export const DEFAULT_ROLE = "user" as const;

export type UserRole = typeof DEFAULT_ROLE | "admin" | "agent";

export const ADMIN_ROLE: UserRole = "admin";
export const AGENT_ROLE: UserRole = "agent";

export const isAdmin = (role?: string | null) =>
  role?.toLowerCase() === ADMIN_ROLE;
export const isAgent = (role?: string | null) =>
  role?.toLowerCase() === AGENT_ROLE;

export const normalizeRole = (role?: string | null): UserRole => {
  const value = role?.toLowerCase();
  if (value === ADMIN_ROLE) return ADMIN_ROLE;
  if (value === AGENT_ROLE) return AGENT_ROLE;
  return DEFAULT_ROLE;
};
