"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const links = [
  { href: "/buy", label: "Buy" },
  { href: "/rent", label: "Rent" },
  { href: "/sell", label: "Sell" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur-lg"
          : "border-b border-transparent bg-white/70 backdrop-blur-md"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-lg font-bold tracking-tight text-zinc-900 transition-transform hover:scale-105"
          onClick={closeMenu}
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all group-hover:shadow-blue-500/50">
            HC
          </span>
          <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
            HomeConnect
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-lg px-4 py-2 text-base font-medium text-zinc-700 transition-all hover:text-blue-600"
            >
              <span className="relative z-10">{label}</span>
              <span className="absolute inset-0 rounded-lg bg-zinc-100 opacity-0 transition-opacity group-hover:opacity-100"></span>
            </Link>
          ))}
        </div>

        {/* Desktop CTA Buttons */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <Link
            href="#"
            className="rounded-lg px-4 py-2 text-base font-medium text-zinc-700 transition-all hover:bg-zinc-100 hover:text-blue-600"
          >
            Log in
          </Link>
          <Link
            href="#"
            className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
          >
            <span className="relative z-10">Get started</span>
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-sky-400 opacity-0 transition-opacity group-hover:opacity-100"></span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-all hover:bg-zinc-100 active:scale-95 lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={toggleMenu}
        >
          <div className="relative h-6 w-6">
            <span
              className={`absolute left-0 top-1.5 h-0.5 w-6 bg-current transition-all duration-300 ${
                isOpen ? "top-3 rotate-45" : ""
              }`}
            ></span>
            <span
              className={`absolute left-0 top-3 h-0.5 w-6 bg-current transition-all duration-300 ${
                isOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`absolute left-0 top-4.5 h-0.5 w-6 bg-current transition-all duration-300 ${
                isOpen ? "top-3 -rotate-45" : ""
              }`}
            ></span>
          </div>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
          isOpen ? "max-h-96 border-t border-zinc-200/60" : "max-h-0"
        }`}
      >
        <div className="space-y-1 bg-white/95 px-4 py-4 backdrop-blur-lg sm:px-6">
          {links.map(({ href, label }, index) => (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-4 py-3 text-base font-medium text-zinc-800 transition-all hover:bg-zinc-100 hover:text-blue-600 ${
                isOpen ? "animate-fade-in-up" : ""
              }`}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}
          <div className="flex flex-col gap-2.5 pt-3">
            <Link
              href="#"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-all hover:border-blue-600 hover:text-blue-600 active:scale-95"
              onClick={closeMenu}
            >
              Log in
            </Link>
            <Link
              href="#"
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
              onClick={closeMenu}
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
