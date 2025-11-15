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
  LogOut,
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

const AgentDashboardPage = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isAgent, setIsAgent] = useState(false);

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
          // Redirect to regular dashboard if not an agent
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to resolve role", error);
        if (isMounted) {
          setIsAgent(false);
          setIsCheckingRole(false);
          router.push("/dashboard");
        }
      }
    };

    resolveRole();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [session?.user, isPending, router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
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

  if (!isAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-50 via-white to-blue-50">
        <Card className="max-w-md border-zinc-200/80 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <BadgeCheck className="h-5 w-5 text-blue-500" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-600">
            <p>This area is limited to agents only.</p>
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
      {/* Header */}
      <header className="border-b border-zinc-200/60 bg-white/90 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-lg font-bold tracking-tight text-zinc-900 transition-transform hover:scale-105"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 via-blue-500 to-sky-400 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all group-hover:shadow-blue-500/50">
              HC
            </span>
            <span className="bg-linear-to-br from-blue-600 to-sky-500 bg-clip-text text-transparent">
              HomeConnect
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              <BadgeCheck className="h-3 w-3" />
              Agent
            </span>
            <Button onClick={handleSignOut} variant="outline" className="font-medium">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
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
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 via-blue-500 to-sky-400 shadow-lg shadow-blue-500/30">
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
          <div className="grid gap-6 md:grid-cols-3">
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
                  <div className="text-2xl font-bold text-zinc-900">0</div>
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
                  <div className="text-2xl font-bold text-zinc-900">0</div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Active client relationships
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-zinc-200/60 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-600">
                    Documents
                  </CardTitle>
                  <FileText className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-zinc-900">0</div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Pending documents
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/sell">
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
    </div>
  );
};

export default AgentDashboardPage;

