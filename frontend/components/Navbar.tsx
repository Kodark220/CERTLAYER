"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("certlayer_session_token") : null;
    setSignedIn(Boolean(token));
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1220]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-[1.75rem] font-semibold tracking-tight md:text-[2.1rem]">
          <Image
            src="/logo.svg"
            alt="CertLayer logo"
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-contain opacity-95 mix-blend-screen"
            priority
          />
          <span>CertLayer</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
          <a href="/#how" className="hover:text-white">How it works</a>
          <Link href="/explorer" className="hover:text-white">Explorer</Link>
          {signedIn ? (
            <Link href="/dashboard" className="rounded-lg bg-[#2A76F6] px-4 py-2 text-white hover:bg-[#1f63d5]">
              Dashboard
            </Link>
          ) : (
            <Link href="/signin" className="rounded-lg bg-[#2A76F6] px-4 py-2 text-white hover:bg-[#1f63d5]">
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 md:hidden"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            {mobileOpen ? (
              <path d="M5 5l10 10M15 5L5 15" />
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen ? (
        <nav className="border-t border-white/10 bg-[#0B1220]/95 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            <a href="/#how" onClick={() => setMobileOpen(false)} className="py-2 text-white/80 hover:text-white">How it works</a>
            <Link href="/explorer" onClick={() => setMobileOpen(false)} className="py-2 text-white/80 hover:text-white">Explorer</Link>
            {signedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-[#2A76F6] text-sm font-semibold text-white hover:bg-[#1f63d5]"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/signin"
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-[#2A76F6] text-sm font-semibold text-white hover:bg-[#1f63d5]"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
