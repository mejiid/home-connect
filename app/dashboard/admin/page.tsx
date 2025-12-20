"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Shield, UserCheck, UserMinus, FileText, Home, CheckCircle2, XCircle, Clock, Eye, X, Map } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/client";
import { FilePreviewModal } from "@/components/file-preview-modal";

type Agent = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Submission = {
  id: string;
  type: "sell" | "lessor";
  userId: string;
  fullName: string;
  phoneNumber: string;
  woreda: string;
  kebele: string;
  village: string;
  identityDocumentUrl: string;
  homeMapUrl: string;
  status: "pending" | "accepted" | "rejected";
  statusUpdatedByName?: string | null;
  statusUpdatedByEmail?: string | null;
  statusUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  email: string;
  userName: string | null;
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
  const [formAgentName, setFormAgentName] = useState("");
  const [formAgentPhone, setFormAgentPhone] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [submissions, setSubmissions] = useState<{ sell: Submission[]; lessor: Submission[] }>({ sell: [], lessor: [] });
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"agents" | "submissions">("agents");

  // Preview Modal State (mirrors agent dashboard behavior)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openPreview = (url: unknown, title: string) => {
    const normalizedUrl = typeof url === "string" ? url.trim() : "";
    if (!normalizedUrl) {
      return;
    }

    setPreviewUrl(normalizedUrl);
    setPreviewTitle(title);
    setIsPreviewOpen(true);
  };

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

  const fetchSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    try {
      const response = await fetch("/api/submissions/all", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setSubmissionsLoading(false);
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

        if (resolvedRole === "agent") {
          router.replace("/dashboard/agent");
          return;
        }

        const admin = resolvedRole === "admin";
        setIsAdmin(admin);
        setIsCheckingRole(false);

        if (admin) {
          fetchAgents();
          fetchSubmissions();
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
  }, [session?.user, isPending, router, fetchAgents, fetchSubmissions]);

  const handleAssignAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = formEmail.trim();
    const agentName = formAgentName.trim();
    const agentPhone = formAgentPhone.trim();
    if (!email) {
      setFeedback({
        type: "error",
        message: "Please provide an email address.",
      });
      return;
    }

    if (!agentName) {
      setFeedback({
        type: "error",
        message: "Agent name is required.",
      });
      return;
    }

    if (!agentPhone) {
      setFeedback({
        type: "error",
        message: "Agent phone number is required.",
      });
      return;
    }

    // Validate email format on frontend
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFeedback({
        type: "error",
        message: "Please provide a valid email address.",
      });
      return;
    }

    const phoneDigits = agentPhone.replace(/\D/g, "");
    if (phoneDigits.length < 7) {
      setFeedback({
        type: "error",
        message: "Please provide a valid phone number.",
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
        body: JSON.stringify({ email, name: agentName, phone: agentPhone }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 403) {
          setIsAdmin(false);
          setFeedback({
            type: "error",
            message: data.message || "You are not authorized to assign agents.",
          });
          return;
        }

        // Show the specific error message from the API
        const errorMessage =
          data.message || data.error || "Failed to assign agent role";
        setFeedback({
          type: "error",
          message: errorMessage,
        });
        return;
      }

      setFeedback({
        type: "success",
        message: data.message ?? "Agent role assigned successfully.",
      });
      setFormEmail("");
      setFormAgentName("");
      setFormAgentPhone("");
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

  const handleStatusUpdate = async (id: string, type: "sell" | "lessor", newStatus: "accepted" | "rejected") => {
    setUpdatingStatus(id);
    try {
      const response = await fetch(`/api/submissions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, type }),
      });

      if (response.ok) {
        await fetchSubmissions();
        if (selectedSubmission?.id === id) {
          setSelectedSubmission({
            ...selectedSubmission,
            status: newStatus,
            statusUpdatedByName: session?.user?.name ?? selectedSubmission.statusUpdatedByName,
            statusUpdatedByEmail: session?.user?.email ?? selectedSubmission.statusUpdatedByEmail,
            statusUpdatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (
    status: string,
    statusUpdatedByName?: string | null,
    statusUpdatedByEmail?: string | null
  ) => {
    const reviewerLabel = (statusUpdatedByName ?? statusUpdatedByEmail ?? "").trim();
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {reviewerLabel ? `Accepted by ${reviewerLabel}` : "Accepted"}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            <XCircle className="h-3 w-3 mr-1" />
            {reviewerLabel ? `Rejected by ${reviewerLabel}` : "Rejected"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
    }
  };

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
            <Button onClick={() => router.push("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-sky-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-zinc-700">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">
                Admin Control Center
              </h1>
              <p className="text-sm text-zinc-600">
                Manage agents and review property submissions.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Link href="/dashboard/properties/add">
              <Button className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                List New Property
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("agents")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "agents"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "submissions"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Submissions
          </button>
        </div>

        {activeTab === "agents" && (
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
                  className="flex flex-col gap-3"
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input
                      type="email"
                      placeholder="agent@example.com"
                      value={formEmail}
                      onChange={(event) => setFormEmail(event.target.value)}
                      required
                    />
                    <Input
                      type="text"
                      placeholder="Agent name"
                      value={formAgentName}
                      onChange={(event) => setFormAgentName(event.target.value)}
                      required
                    />
                    <Input
                      type="tel"
                      placeholder="Agent phone"
                      value={formAgentPhone}
                      onChange={(event) => setFormAgentPhone(event.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={assignLoading}
                    className="sm:w-fit"
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
                        {agent.phone ? (
                          <p className="text-xs text-zinc-500">
                            {agent.phone}
                          </p>
                        ) : null}
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
        )}

        {activeTab === "submissions" && (
          <div className="space-y-6">
            {/* Sell Submissions */}
            <Card className="border-zinc-200/70 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  Sell Homes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                  </div>
                ) : submissions.sell.length === 0 ? (
                  <p className="text-center text-zinc-500 py-6">No sell submissions</p>
                ) : (
                  <div className="space-y-3">
                    {submissions.sell.map((submission) => (
                      <div
                        key={submission.id}
                        className="border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold">{submission.fullName}</span>
                              {getStatusBadge(
                                submission.status,
                                submission.statusUpdatedByName,
                                submission.statusUpdatedByEmail
                              )}
                            </div>
                            <p className="text-sm text-zinc-600 mb-1">
                              {submission.email} • {submission.woreda}, {submission.kebele}, {submission.village}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Submitted: {formatDate(submission.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            {submission.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusUpdate(submission.id, "sell", "accepted")}
                                  disabled={updatingStatus === submission.id}
                                >
                                  {updatingStatus === submission.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Accept"
                                  )}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(submission.id, "sell", "rejected")}
                                  disabled={updatingStatus === submission.id}
                                >
                                  {updatingStatus === submission.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Reject"
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lessor Submissions */}
            <Card className="border-zinc-200/70 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />
                  Lessor Homes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                  </div>
                ) : submissions.lessor.length === 0 ? (
                  <p className="text-center text-zinc-500 py-6">No lessor submissions</p>
                ) : (
                  <div className="space-y-3">
                    {submissions.lessor.map((submission) => (
                      <div
                        key={submission.id}
                        className="border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold">{submission.fullName}</span>
                              {getStatusBadge(
                                submission.status,
                                submission.statusUpdatedByName,
                                submission.statusUpdatedByEmail
                              )}
                            </div>
                            <p className="text-sm text-zinc-600 mb-1">
                              {submission.email} • {submission.woreda}, {submission.kebele}, {submission.village}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Submitted: {formatDate(submission.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            {submission.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusUpdate(submission.id, "lessor", "accepted")}
                                  disabled={updatingStatus === submission.id}
                                >
                                  {updatingStatus === submission.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Accept"
                                  )}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(submission.id, "lessor", "rejected")}
                                  disabled={updatingStatus === submission.id}
                                >
                                  {updatingStatus === submission.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Reject"
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-zinc-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900">Submission Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">Type:</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {selectedSubmission.type === "sell" ? "Sell" : "Lessor"}
                  </span>
                  {getStatusBadge(
                    selectedSubmission.status,
                    selectedSubmission.statusUpdatedByName,
                    selectedSubmission.statusUpdatedByEmail
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600">Full Name</label>
                    <p className="text-zinc-900">{selectedSubmission.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600">Phone Number</label>
                    <p className="text-zinc-900">{selectedSubmission.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600">Email</label>
                    <p className="text-zinc-900">{selectedSubmission.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600">Woreda</label>
                    <p className="text-zinc-900">{selectedSubmission.woreda}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600">Kebele</label>
                    <p className="text-zinc-900">{selectedSubmission.kebele}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-zinc-600">Village</label>
                    <p className="text-zinc-900">{selectedSubmission.village}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-600 mb-2 block">Identity Document</label>
                  {typeof selectedSubmission.identityDocumentUrl === "string" && selectedSubmission.identityDocumentUrl.trim() ? (
                    <Button
                      variant="link"
                      className="px-0 text-blue-600 h-auto font-normal hover:no-underline hover:text-blue-700 flex items-center gap-2"
                      onClick={() => openPreview(selectedSubmission.identityDocumentUrl, "Identity Document")}
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </Button>
                  ) : (
                    <p className="text-sm text-zinc-500">Not provided</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-600 mb-2 block">Government Home Map</label>
                  {typeof selectedSubmission.homeMapUrl === "string" && selectedSubmission.homeMapUrl.trim() ? (
                    <Button
                      variant="link"
                      className="px-0 text-blue-600 h-auto font-normal hover:no-underline hover:text-blue-700 flex items-center gap-2"
                      onClick={() => openPreview(selectedSubmission.homeMapUrl, "Government Home Map")}
                    >
                      <Map className="h-4 w-4" />
                      View Map
                    </Button>
                  ) : (
                    <p className="text-sm text-zinc-500">Not provided</p>
                  )}
                </div>

                {selectedSubmission.status === "pending" && (
                  <div className="pt-4 border-t border-zinc-200 flex gap-3">
                    <Button
                      onClick={() => {
                        handleStatusUpdate(selectedSubmission.id, selectedSubmission.type, "accepted");
                        setSelectedSubmission(null);
                      }}
                      disabled={updatingStatus === selectedSubmission.id}
                    >
                      {updatingStatus === selectedSubmission.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleStatusUpdate(selectedSubmission.id, selectedSubmission.type, "rejected");
                        setSelectedSubmission(null);
                      }}
                      disabled={updatingStatus === selectedSubmission.id}
                    >
                      {updatingStatus === selectedSubmission.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* File Preview Modal */}
        <FilePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          url={previewUrl}
          title={previewTitle}
        />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
