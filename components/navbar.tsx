"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Key,
  DollarSign,
  Building2,
  LogOut,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { authClient } from "@/lib/client";

const links = [
  { href: "/buy", label: "Buy", icon: Home },
  { href: "/rent", label: "Rent", icon: Key },
  { href: "/sell", label: "Sell", icon: DollarSign },
  { href: "/lessor", label: "Lessor", icon: Building2 },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isFetchingRole, setIsFetchingRole] = useState(false);
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get session data
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) {
      setUserRole("");
      setIsFetchingRole(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    setIsFetchingRole(true);

    const fetchRole = async () => {
      try {
        const response = await fetch("/api/user/role", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (isMounted) {
            setUserRole("");
          }
          return;
        }

        const data = (await response.json()) as { role?: string | null };
        if (isMounted) {
          setUserRole(data.role?.toString().toLowerCase() ?? "");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const isAbortError =
          typeof DOMException !== "undefined" && error instanceof DOMException
            ? error.name === "AbortError"
            : (error as { name?: string } | null)?.name === "AbortError";

        if (!isAbortError) {
          console.error("Failed to fetch user role:", error);
          setUserRole("");
        }
      } finally {
        if (isMounted) {
          setIsFetchingRole(false);
        }
      }
    };

    fetchRole();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [session?.user?.id]);

  const roleSpecificLinks = (() => {
    const roleLinks: {
      href: string;
      label: string;
      icon: typeof Home;
    }[] = [];

    if (userRole === "admin") {
      roleLinks.push({
        href: "/dashboard/admin",
        label: "Admin Dashboard",
        icon: Shield,
      });
    }

    if (userRole === "agent") {
      roleLinks.push({
        href: "/dashboard/agent",
        label: "Agent Dashboard",
        icon: BadgeCheck,
      });
    }

    return roleLinks;
  })();

  const showUserDashboardLink = userRole !== "admin" && userRole !== "agent";

  const menuLinks = [...links, ...roleSpecificLinks];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Click outside handler for user menu
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => {
    setIsOpen(false);
    setShowUserMenu(false);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    closeMenu();
    window.location.href = "/";
  };

  // Get user initials for avatar
  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-zinc-200/80 bg-white/80 shadow-lg shadow-zinc-900/5 backdrop-blur-xl"
          : "border-b border-transparent bg-white/60 backdrop-blur-md"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-lg font-bold tracking-tight transition-all"
          onClick={closeMenu}
        >
          <motion.span
            whileHover={{ scale: 1.05, rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-blue-600 via-blue-500 to-sky-400 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all group-hover:shadow-xl group-hover:shadow-blue-500/50"
          >
            HC
          </motion.span>
          <span className="bg-linear-to-r  from-blue-600 to-sky-500 bg-clip-text text-transparent">
            HomeConnect
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {menuLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-2 rounded-lg px-4 py-2 text-base font-medium transition-all ${
                  isActive
                    ? "text-blue-600"
                    : "text-zinc-700 hover:text-blue-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="relative z-10">{label}</span>
                <motion.span
                  className={`absolute inset-0 rounded-lg ${
                    isActive
                      ? "bg-linear-to-r  from-blue-50 to-sky-50"
                      : "bg-linear-to-r  from-zinc-100 to-zinc-50 opacity-0"
                  }`}
                  initial={{ opacity: isActive ? 1 : 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-linear-to-r  from-blue-600 to-sky-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA Buttons */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {" "}
          {/* User Authentication Section */}
          {isPending ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200" />
          ) : session?.user ? (
            <div className="relative" ref={userMenuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-blue-600 to-sky-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/30">
                  {getUserInitials(session.user.name)}
                </div>
                <span className="text-sm font-medium text-zinc-700">
                  {session.user.name || session.user.email}
                </span>
              </motion.button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-200 bg-white shadow-xl"
                  >
                    <div className="p-3 border-b border-zinc-200">
                      <p className="text-sm font-medium text-zinc-900">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {session.user.email}
                      </p>
                    </div>
                    <div className="p-2">
                      <div className="space-y-1">
                        {showUserDashboardLink && (
                          <Link
                            href="/dashboard"
                            onClick={closeMenu}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                          >
                            <Home className="h-4 w-4" />
                            Dashboard
                          </Link>
                        )}
                        {roleSpecificLinks.map(
                          ({ href, label, icon: IconLink }) => (
                            <Link
                              key={href}
                              href={href}
                              onClick={closeMenu}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                            >
                              <IconLink className="h-4 w-4" />
                              {label}
                            </Link>
                          )
                        )}
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-lg px-4 py-2 text-base font-medium text-zinc-700 transition-all hover:bg-zinc-100 hover:text-blue-600"
              >
                Log in
              </Link>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/signup"
                  className="group relative overflow-hidden rounded-lg bg-linear-to-r  from-blue-600 to-sky-500 px-5 py-2 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/50"
                >
                  <span className="relative z-10">Get started</span>
                  <span className="absolute inset-0 bg-linear-to-r  from-blue-500 to-sky-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {" "}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-all hover:bg-zinc-100"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
            onClick={toggleMenu}
          >
            <div className="relative h-6 w-6">
              <motion.span
                animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-1.5 h-0.5 w-6 bg-current"
              />
              <motion.span
                animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-3 h-0.5 w-6 bg-current"
              />
              <motion.span
                animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-4.5 h-0.5 w-6 bg-current"
              />
            </div>
          </motion.button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-zinc-200/60 lg:hidden"
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-1 bg-white/95 px-4 py-4 backdrop-blur-xl sm:px-6"
            >
              {menuLinks.map(({ href, label, icon: Icon }, index) => {
                const isActive = pathname === href;
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all ${
                        isActive
                          ? "bg-linear-to-r  from-blue-50 to-sky-50 text-blue-600"
                          : "text-zinc-800 hover:bg-linear-to-r  hover:from-zinc-100 hover:to-zinc-50 hover:text-blue-600"
                      }`}
                      onClick={closeMenu}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeMobileTab"
                          className="ml-auto h-2 w-2 rounded-full bg-blue-600"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: links.length * 0.1 + 0.1, duration: 0.3 }}
                className="flex flex-col gap-2.5 pt-3 border-t border-zinc-200"
              >
                {session?.user ? (
                  <>
                    <div className="px-4 py-3 rounded-lg bg-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r from-blue-600 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/30">
                          {getUserInitials(session.user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {session.user.name || "User"}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    {showUserDashboardLink && (
                      <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-all hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                        onClick={closeMenu}
                      >
                        <Home className="h-4 w-4" />
                        Dashboard
                      </Link>
                    )}
                    {roleSpecificLinks.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {roleSpecificLinks.map(
                          ({ href, label, icon: IconLink }) => (
                            <Link
                              key={href}
                              href={href}
                              className="flex items-center justify-center gap-2 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-all hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                              onClick={closeMenu}
                            >
                              <IconLink className="h-4 w-4" />
                              {label}
                            </Link>
                          )
                        )}
                      </div>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:bg-red-700 active:scale-95"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-all hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                      onClick={closeMenu}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="w-full rounded-lg bg-linear-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/50 active:scale-95"
                      onClick={closeMenu}
                    >
                      Get started
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
