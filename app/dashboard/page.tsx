"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  FileText,
  Map,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
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
  statusUpdatedByEmail?: string | null;
  statusUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const compareByCreatedAtDesc = (a: Submission, b: Submission) => {
  const aTime = Date.parse(a.createdAt);
  const bTime = Date.parse(b.createdAt);
  return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
};

const getStatusBadge = (status: string, statusUpdatedByEmail?: string | null) => {
  switch (status) {
    case "accepted":
      return (
        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {statusUpdatedByEmail ? `Accepted by ${statusUpdatedByEmail}` : "Accepted"}
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          <XCircle className="h-3 w-3 mr-1" />
          {statusUpdatedByEmail ? `Rejected by ${statusUpdatedByEmail}` : "Rejected"}
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setSubmissionsError(null);
    try {
      const response = await fetch("/api/submissions/my", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.push("/signin");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const allSubmissions = [...data.sell, ...data.lessor].sort(compareByCreatedAtDesc);
        setSubmissions(allSubmissions as Submission[]);
      } else {
        let message = `Failed to load submissions (${response.status})`;
        try {
          const err = await response.json();
          if (err?.error) message = `${String(err.error)} (${response.status})`;
        } catch {
          // ignore
        }
        setSubmissionsError(message);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      setSubmissionsError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signup");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!session?.user) return;

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
        const resolvedRole = data.role?.toString().toLowerCase() ?? null;

        if (!isMounted) return;

        setRole(resolvedRole);
        setRoleChecked(true);

        if (resolvedRole === "admin") {
          router.replace("/dashboard/admin");
          return;
        }

        if (resolvedRole === "agent") {
          router.replace("/dashboard/agent");
          return;
        }

        fetchSubmissions();
      } catch (error) {
        console.error("Failed to resolve role", error);
        if (isMounted) {
          setRole(null);
          setRoleChecked(true);
          fetchSubmissions();
        }
      }
    };

    resolveRole();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [session?.user, router, fetchSubmissions]);

  if (isPending || loading || (session?.user && !roleChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (role === "admin" || role === "agent") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Header */}
      <header className="border-b border-zinc-200/60 bg-white/90 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        </nav>
      </header>

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
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
              Welcome back, {session.user?.name || "User"}! 🎉
            </h1>
            <p className="text-lg text-zinc-600">
              View and manage your property submissions
            </p>
          </div>

          {/* Submissions Section */}
          <Card className="border-zinc-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                My Submissions
              </CardTitle>
              <CardDescription>
                View all your property listing submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissionsError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {submissionsError}
                </div>
              ) : null}
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                  <p className="text-zinc-600 mb-4">No submissions yet</p>
                  <div className="flex gap-4 justify-center">
                    <Link href="/sell">
                      <Button>Submit Sell Listing</Button>
                    </Link>
                    <Link href="/lessor">
                      <Button variant="outline">Submit Rent Listing</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-zinc-900">
                              {submission.type === "sell" ? "Sell" : "Lessor"} Submission
                            </h3>
                            {getStatusBadge(submission.status, submission.statusUpdatedByEmail)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Submitted: {formatDate(submission.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>
                                {submission.woreda}, {submission.kebele}, {submission.village}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link href="/sell">
                <Card className="border-zinc-200/60 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      💰 Sell Properties
                    </CardTitle>
                    <CardDescription>
                      List your property for sale
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/lessor">
                <Card className="border-zinc-200/60 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      🔑 Rent Properties
                    </CardTitle>
                    <CardDescription>
                      List your property for rent
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/">
                <Card className="border-zinc-200/60 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      🏠 Browse Properties
                    </CardTitle>
                    <CardDescription>
                      Explore available properties
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-zinc-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">
                Submission Details
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSubmission(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-semibold">Type:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {selectedSubmission.type === "sell" ? "Sell" : "Lessor"}
                </span>
                {getStatusBadge(selectedSubmission.status, selectedSubmission.statusUpdatedByEmail)}
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
                <label className="text-sm font-medium text-zinc-600 mb-2 block">
                  Identity Document
                </label>
                <a
                  href={selectedSubmission.identityDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Document
                </a>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-600 mb-2 block">
                  Government Home Map
                </label>
                <a
                  href={selectedSubmission.homeMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  View Map
                </a>
              </div>

              <div className="pt-4 border-t border-zinc-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-zinc-600">Submitted</label>
                    <p className="text-zinc-900">{formatDate(selectedSubmission.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-zinc-600">Last Updated</label>
                    <p className="text-zinc-900">{formatDate(selectedSubmission.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
