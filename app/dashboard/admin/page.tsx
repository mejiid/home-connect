"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, UserCheck, UserMinus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/client";

type Agent = {
  id: string;
  email: string;
  name?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
};

const AdminDashboardPage = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const fetchAgents = useCallback(async () => {
    setAgentsLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/agents", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json()) as {
        agents?: Agent[];
        message?: string;
      };

      if (!response.ok) {
        if (response.status === 403) {
          setIsAdmin(false);
          setFeedback({
            type: "error",
            message: "You are not authorized to view agents.",
          });
          return;
        }

        throw new Error(data.message || "Failed to load agents");
      }

      setAgents(data.agents ?? []);
    } catch (error) {
      console.error("Failed to load agents", error);
      setFeedback({
        type: "error",
        message: "Unable to load agents right now.",
      });
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.push("/signin");
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const resolveRole = async () => {
      try {
        const response = await fetch("/api/user/role", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Role fetch failed");
        }

        const data = (await response.json()) as { role?: string | null };
        const resolvedRole = data.role?.toString().toLowerCase();

        if (!isMounted) {
          return;
        }

        const admin = resolvedRole === "admin";
        setIsAdmin(admin);
        setIsCheckingRole(false);

        if (admin) {
          fetchAgents();
        }
      } catch (error) {
        console.error("Failed to resolve role", error);
        if (isMounted) {
          setIsAdmin(false);
          setIsCheckingRole(false);
        }
      }
    };

    resolveRole();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [session?.user, isPending, router, fetchAgents]);

  const handleAssignAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = formEmail.trim();
    if (!email) {
      setFeedback({
        type: "error",
        message: "Please provide an email address.",
      });
      return;
    }

    setAssignLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        if (response.status === 403) {
          setIsAdmin(false);
          setFeedback({
            type: "error",
            message: data.message || "You are not authorized to assign agents.",
          });
          return;
        }

        throw new Error(data.message || "Failed to assign agent role");
      }

      setFeedback({
        type: "success",
        message: data.message ?? "Agent role assigned.",
      });
      setFormEmail("");
      fetchAgents();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to assign agent role.";
      setFeedback({ type: "error", message });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveAgent = async (id: string) => {
    setRemovingId(id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/agents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        if (response.status === 403) {
          setIsAdmin(false);
          setFeedback({
            type: "error",
            message: data.message || "You are not authorized to remove agents.",
          });
          return;
        }

        throw new Error(data.message || "Failed to remove agent role");
      }

      setFeedback({
        type: "success",
        message: data.message ?? "Agent role removed.",
      });
      fetchAgents();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove agent role.";
      setFeedback({ type: "error", message });
    } finally {
      setRemovingId(null);
    }
  };

  const totalAgents = useMemo(() => agents.length, [agents]);

  if (isPending || isCheckingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-sky-50">
        <div className="flex flex-col items-center gap-3 text-zinc-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-50 via-white to-blue-50">
        <Card className="max-w-md border-zinc-200/80 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <Shield className="h-5 w-5 text-red-500" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-600">
            <p>This area is limited to administrators.</p>
            <Button onClick={() => router.push("/dashboard")}>
              Return to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-sky-50">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-zinc-700">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">
                Admin Control Center
              </h1>
              <p className="text-sm text-zinc-600">
                Manage which users have access to the agent dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr,1fr]">
          <Card className="border-zinc-200/70 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-zinc-900">
                Current agents
              </CardTitle>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {totalAgents} active
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    feedback.type === "success"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <div className="rounded-lg border border-dashed border-zinc-200 bg-white/80 p-4">
                <form
                  onSubmit={handleAssignAgent}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <Input
                    type="email"
                    placeholder="agent@example.com"
                    value={formEmail}
                    onChange={(event) => setFormEmail(event.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={assignLoading}
                    className="sm:w-auto"
                  >
                    {assignLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                    Assign agent
                  </Button>
                </form>
                <p className="mt-2 text-xs text-zinc-500">
                  Provide the email of an existing user account to grant agent
                  access.
                </p>
              </div>

              <Separator />

              {agentsLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white/70 p-6 text-sm text-zinc-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading agents...
                </div>
              ) : agents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-200 bg-white/60 p-6 text-center text-sm text-zinc-500">
                  No agents assigned yet. Add one above to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white/80 p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {agent.name || agent.email}
                        </p>
                        <p className="text-xs text-zinc-500">{agent.email}</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Updated{" "}
                          {formatDate(agent.updatedAt || agent.createdAt)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={removingId === agent.id}
                        onClick={() => handleRemoveAgent(agent.id)}
                        className="sm:w-auto"
                      >
                        {removingId === agent.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-fit border-zinc-200/70 bg-white/80 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-zinc-900">
                Quick tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-600">
              <div className="rounded-lg bg-blue-50 p-4 text-blue-700">
                Agents gain access to the dedicated agent dashboard and tools.
              </div>
              <ul className="space-y-2 list-disc pl-5">
                <li>Only existing user accounts can be promoted to agent.</li>
                <li>Removing an agent downgrades them to a regular user.</li>
                <li>
                  Changes take effect immediately and notify the user on next
                  sign-in.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
