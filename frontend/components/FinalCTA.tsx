import Link from "next/link";

export default function FinalCTA() {
  return (
    <>
    <section className="border-t border-white/10 py-24 text-center">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-4xl font-semibold">Turn Reliability Into Trust</h2>
        <p className="mt-4 text-white/70">
          Offer measurable accountability and verifiable performance to users, partners, and institutions.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#2A76F6] px-6 text-sm font-semibold hover:bg-[#1f63d5]"
          >
            Register Your Protocol
          </Link>

          <Link
            href="/explorer"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-sm font-semibold text-white/90 hover:border-white/25 hover:text-white"
          >
            View Reputation Explorer
          </Link>
        </div>
      </div>
    </section>

    <footer className="border-t border-white/10 bg-[#070b12]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 md:flex-row md:justify-between">
        <div>
          <div className="text-lg font-semibold">CertLayer</div>
          <p className="mt-1 text-xs text-white/50">Automated accountability for Web3 infrastructure.</p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-white/60">
          <Link href="/explorer" className="hover:text-white">Explorer</Link>
          <Link href="/register" className="hover:text-white">Register</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/signin" className="hover:text-white">Sign In</Link>
        </nav>
        <p className="text-xs text-white/35">&copy; {new Date().getFullYear()} CertLayer. Built on GenLayer.</p>
      </div>
    </footer>
    </>
  );
}

