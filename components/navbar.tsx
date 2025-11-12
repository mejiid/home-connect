"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  Home,
  Key,
  DollarSign,
  Building2,
  LogOut,
  User as UserIcon,
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get session data
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }

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

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
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
          ? "border-b border-zinc-200/80 bg-white/80 shadow-lg shadow-zinc-900/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:shadow-zinc-900/20"
          : "border-b border-transparent bg-white/60 backdrop-blur-md dark:bg-zinc-950/60"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all group-hover:shadow-xl group-hover:shadow-blue-500/50 dark:shadow-blue-500/20 dark:group-hover:shadow-blue-500/40"
          >
            HC
          </motion.span>
          <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-sky-400">
            HomeConnect
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-2 rounded-lg px-4 py-2 text-base font-medium transition-all ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="relative z-10">{label}</span>
                <motion.span
                  className={`absolute inset-0 rounded-lg ${
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/50 dark:to-sky-950/50"
                      : "bg-gradient-to-r from-zinc-100 to-zinc-50 opacity-0 dark:from-zinc-800 dark:to-zinc-800/50"
                  }`}
                  initial={{ opacity: isActive ? 1 : 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-blue-600 to-sky-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA Buttons */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="rounded-lg p-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDarkMode ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* User Authentication Section */}
          {isPending ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          ) : session?.user ? (
            <div className="relative" ref={userMenuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/30">
                  {getUserInitials(session.user.name)}
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {session.user.email}
                      </p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-lg px-4 py-2 text-base font-medium text-zinc-700 transition-all hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
              >
                Log in
              </Link>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/signup"
                  className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/50 dark:shadow-blue-500/20 dark:hover:shadow-blue-500/40"
                >
                  <span className="relative z-10">Get started</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-sky-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile Menu Button & Theme Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="rounded-lg p-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDarkMode ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-all hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
            className="overflow-hidden border-t border-zinc-200/60 lg:hidden dark:border-zinc-800/60"
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-1 bg-white/95 px-4 py-4 backdrop-blur-xl sm:px-6 dark:bg-zinc-950/95"
            >
              {links.map(({ href, label, icon: Icon }, index) => {
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
                          ? "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-600 dark:from-blue-950/50 dark:to-sky-950/50 dark:text-blue-400"
                          : "text-zinc-800 hover:bg-gradient-to-r hover:from-zinc-100 hover:to-zinc-50 hover:text-blue-600 dark:text-zinc-200 dark:hover:from-zinc-800 dark:hover:to-zinc-800/50 dark:hover:text-blue-400"
                      }`}
                      onClick={closeMenu}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeMobileTab"
                          className="ml-auto h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"
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
                className="flex flex-col gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800"
              >
                {session?.user ? (
                  <>
                    <div className="px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/30">
                          {getUserInitials(session.user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                            {session.user.name || "User"}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
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
                      className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-all hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-500 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                      onClick={closeMenu}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/50 active:scale-95 dark:shadow-blue-500/20 dark:hover:shadow-blue-500/40"
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
