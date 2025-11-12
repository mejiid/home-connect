"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, LogOut, User } from "lucide-react";
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

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    // Redirect to signup if not authenticated
    if (!isPending && !session) {
      router.push("/signup");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  if (isPending) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Header */}
      <header className="border-b border-zinc-200/60 bg-white/90 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-lg font-bold tracking-tight text-zinc-900 transition-transform hover:scale-105"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all group-hover:shadow-blue-500/50">
              HC
            </span>
            <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
              HomeConnect
            </span>
          </Link>

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
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
              You've successfully signed up to HomeConnect. Explore properties
              and find your dream home.
            </p>
          </div>

          {/* User Info Card */}
          <Card className="border-zinc-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                <span className="text-sm font-medium text-zinc-600">Name</span>
                <span className="text-sm text-zinc-900">
                  {session.user?.name || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                <span className="text-sm font-medium text-zinc-600">Email</span>
                <span className="text-sm text-zinc-900">
                  {session.user?.email}
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

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link href="/buy">
                <Card className="border-zinc-200/60 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      🏠 Buy Properties
                    </CardTitle>
                    <CardDescription>
                      Browse available properties for purchase
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
              <Link href="/rent">
                <Card className="border-zinc-200/60 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      🔑 Rent Properties
                    </CardTitle>
                    <CardDescription>
                      Find rental properties in your area
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
          </div>

          {/* Back to Home */}
          <div className="flex justify-center pt-6">
            <Link href="/">
              <Button variant="outline" className="font-medium">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
