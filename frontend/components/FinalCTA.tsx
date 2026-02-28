import Link from "next/link";

export default function FinalCTA() {
  return (
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
  );
}

