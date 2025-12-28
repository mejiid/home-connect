"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  BadgeCheck,
  Home,
  Users,
  FileText,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  Map,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/client";
import { FilePreviewModal } from "@/components/file-preview-modal";
import type { Property } from "@/types";

type Submission = {
  id: string;
  type: "sell" | "lessor";
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
  createdAt?: string;
  updatedAt?: string;
  email: string;
  userName?: string | null;
};

const AgentDashboardPage = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isAgent, setIsAgent] = useState(false);
  const [stats, setStats] = useState<{ activeListings: number; clients: number }>({
    activeListings: 0,
    clients: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<{ sell: Submission[]; lessor: Submission[] }>({ sell: [], lessor: [] });
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [updatingPropertyId, setUpdatingPropertyId] = useState<string | null>(null);
  
  // Preview Modal State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openPreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setIsPreviewOpen(true);
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/agent/stats", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        activeListings?: number;
        clients?: number;
      };

      setStats({
        activeListings: Number(data.activeListings ?? 0),
        clients: Number(data.clients ?? 0),
      });
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProperties = async () => {
    setPropertiesLoading(true);
    try {
      const response = await fetch("/api/agent/properties", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setProperties([]);
        return;
      }

      const data = (await response.json()) as { properties?: Property[] };
      setProperties(Array.isArray(data.properties) ? data.properties : []);
    } catch (error) {
      console.error("Failed to fetch agent properties:", error);
      setProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const handlePropertyStatusUpdate = async (
    id: string,
    status: "Sold" | "Leased"
  ) => {
    setUpdatingPropertyId(id);
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        return;
      }

      // Remove from local list immediately (since only Available are shown)
      setProperties((current) => current.filter((p) => p.id !== id));
      await fetchStats();
      await fetchProperties();
    } catch (error) {
      console.error("Failed to update property status:", error);
    } finally {
      setUpdatingPropertyId(null);
    }
  };

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

        const agent = resolvedRole === "agent";
        setIsAgent(agent);
        setIsCheckingRole(false);

        if (!agent) {
          if (resolvedRole === "admin") {
            router.replace("/dashboard/admin");
            return;
          }

          // Regular users should use the user dashboard.
          router.replace("/dashboard");
          return;
        }

        fetchSubmissions();
        fetchStats();
        fetchProperties();
      } catch (error) {
        console.error("Failed to resolve role", error);
        if (isMounted) {
          setIsAgent(false);
          setIsCheckingRole(false);
          router.replace("/");
        }
      }
    };

    resolveRole();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [session?.user, isPending, router]);

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const response = await fetch("/api/submissions/all", {
        credentials: "include",
      });
      if (response.ok) {
        const data = (await response.json()) as {
          sell: Submission[];
          lessor: Submission[];
        };
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

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
        await fetchStats();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="flex flex-col items-center gap-3 text-zinc-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-blue-50">
        <Card className="max-w-md border-zinc-200/80 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <BadgeCheck className="h-5 w-5 text-blue-500" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-600">
            <p>This area is limited to agents only.</p>
            <Button onClick={() => router.push("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 shadow-lg shadow-blue-500/30">
                <BadgeCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Agent Dashboard
                </h1>
                <p className="text-lg text-zinc-600">
                  Welcome back, {session?.user?.name || "Agent"}! Manage your
                  properties and clients.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-zinc-200/60 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-600">
                    Active Listings
                  </CardTitle>
                  <Home className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-zinc-900">
                    {statsLoading ? "…" : stats.activeListings}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Properties you&apos;re managing
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-zinc-200/60 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-600">
                    Clients
                  </CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-zinc-900">
                    {statsLoading ? "…" : stats.clients}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Active client relationships
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* My Active Listings */}
          <Card className="border-zinc-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600" />
                My Active Listings
              </CardTitle>
              <CardDescription>
                Mark a home Sold or Leased to remove it from listings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                </div>
              ) : properties.length === 0 ? (
                <p className="text-center text-zinc-500 py-4 text-sm">
                  No active listings
                </p>
              ) : (
                <div className="space-y-2">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className="border border-zinc-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {property.title}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                              {property.listingType === "rent" ? "Rent" : property.listingType === "sell" ? "Sell" : "Listing"}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600">
                            {property.city} • {property.type} • {new Intl.NumberFormat("en-ET", { style: "currency", currency: property.currency }).format(property.price)}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/properties/${property.id}`}>View</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePropertyStatusUpdate(property.id, "Sold")}
                            disabled={updatingPropertyId === property.id}
                          >
                            {updatingPropertyId === property.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Mark Sold"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePropertyStatusUpdate(property.id, "Leased")}
                            disabled={updatingPropertyId === property.id}
                          >
                            {updatingPropertyId === property.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Mark Leased"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submissions Section */}
          <Card className="border-zinc-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Property Submissions
              </CardTitle>
              <CardDescription>
                Review and manage property listing submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Sell Submissions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    Sell Homes
                  </h3>
                  {submissionsLoading ? (
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                    </div>
                  ) : submissions.sell.length === 0 ? (
                    <p className="text-center text-zinc-500 py-4 text-sm">No sell submissions</p>
                  ) : (
                    <div className="space-y-2">
                      {submissions.sell.map((submission) => (
                        <div
                          key={submission.id}
                          className="border border-zinc-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{submission.fullName}</span>
                                {getStatusBadge(
                                  submission.status,
                                  submission.statusUpdatedByName,
                                  submission.statusUpdatedByEmail
                                )}
                              </div>
                              <p className="text-xs text-zinc-600">
                                {submission.email} • {submission.woreda}, {submission.kebele}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
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
                                      <Loader2 className="h-3 w-3 animate-spin" />
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
                                      <Loader2 className="h-3 w-3 animate-spin" />
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
                </div>

                {/* Lessor Submissions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4 text-green-600" />
                    Lessor Homes
                  </h3>
                  {submissionsLoading ? (
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                    </div>
                  ) : submissions.lessor.length === 0 ? (
                    <p className="text-center text-zinc-500 py-4 text-sm">No lessor submissions</p>
                  ) : (
                    <div className="space-y-2">
                      {submissions.lessor.map((submission) => (
                        <div
                          key={submission.id}
                          className="border border-zinc-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{submission.fullName}</span>
                                {getStatusBadge(
                                  submission.status,
                                  submission.statusUpdatedByName,
                                  submission.statusUpdatedByEmail
                                )}
                              </div>
                              <p className="text-xs text-zinc-600">
                                {submission.email} • {submission.woreda}, {submission.kebele}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
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
                                      <Loader2 className="h-3 w-3 animate-spin" />
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
                                      <Loader2 className="h-3 w-3 animate-spin" />
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/dashboard/properties/add">
                <Card className="border-zinc-200/60 shadow-lg hover:shadow-xl transition-all cursor-pointer group h-full">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      List New Property
                    </CardTitle>
                    <CardDescription>
                      Add a new property listing to your portfolio
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link href="/lessor">
                <Card className="border-zinc-200/60 shadow-lg hover:shadow-xl transition-all cursor-pointer group h-full">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Manage Clients
                    </CardTitle>
                    <CardDescription>
                      View and manage your client relationships
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="border-zinc-200/60 shadow-lg hover:shadow-xl transition-all cursor-pointer group h-full">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    View Reports
                  </CardTitle>
                  <CardDescription>
                    Access your performance reports and analytics
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </div>

          {/* Account Information */}
          <Card className="border-zinc-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Account Information
              </CardTitle>
              <CardDescription>Your agent account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                <span className="text-sm font-medium text-zinc-600">Name</span>
                <span className="text-sm text-zinc-900">
                  {session?.user?.name || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                <span className="text-sm font-medium text-zinc-600">Email</span>
                <span className="text-sm text-zinc-900">
                  {session?.user?.email}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                <span className="text-sm font-medium text-zinc-600">Role</span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Agent
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-zinc-600">
                  Account Status
                </span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Active
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="border-zinc-200/60 bg-blue-50/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
              <CardDescription>
                Resources and support for agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600">
              <p>
                As an agent, you have access to special tools and features to
                help you manage properties and serve your clients better.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>List and manage property listings</li>
                <li>Track client interactions and relationships</li>
                <li>Access detailed reports and analytics</li>
                <li>Get priority support from our team</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </main>

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
                <Button
                  variant="link"
                  className="px-0 text-blue-600 h-auto font-normal hover:no-underline hover:text-blue-700 flex items-center gap-2"
                  onClick={() => openPreview(selectedSubmission.identityDocumentUrl, "Identity Document")}
                >
                  <FileText className="h-4 w-4" />
                  View Document
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-600 mb-2 block">Government Home Map</label>
                <Button
                  variant="link"
                  className="px-0 text-blue-600 h-auto font-normal hover:no-underline hover:text-blue-700 flex items-center gap-2"
                  onClick={() => openPreview(selectedSubmission.homeMapUrl, "Government Home Map")}
                >
                  <Map className="h-4 w-4" />
                  View Map
                </Button>
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
  );
};

export default AgentDashboardPage;

