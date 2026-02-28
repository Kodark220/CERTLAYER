"use client";

import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1220]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-4 text-3xl font-semibold tracking-tight md:text-4xl">
          <Image
            src="/logo.svg"
            alt="CertLayer logo"
            width={56}
            height={56}
            className="h-12 w-12 rounded-lg md:h-14 md:w-14"
            priority
          />
          <span className="leading-none">CertLayer</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
          <a href="#how" className="hover:text-white">
            How it works
          </a>
          <a href="#explorer" className="hover:text-white">
            Explorer
          </a>
          <a href="#docs" className="hover:text-white">
            Docs
          </a>
          <Link href="/signin" className="rounded-lg px-3 py-2 hover:bg-white/5 hover:text-white">
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}
