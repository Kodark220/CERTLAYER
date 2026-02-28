import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[740px] w-[980px] -translate-x-1/2 rounded-full bg-[#16213A] opacity-60 blur-3xl" />
      </div>

      <Navbar />

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-12">
        <div className="mt-12 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              Automated Accountability for Web3 Infrastructure
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              CertLayer helps protocols publish enforceable reliability commitments, detect verified failures, trigger
              compensation workflows, and build public trust through transparent reputation scoring.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#2A76F6] px-5 text-sm font-semibold hover:bg-[#1f63d5]"
              >
                Register Your Protocol
              </Link>

              <Link
                href="/explorer"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white/90 hover:border-white/25 hover:text-white"
              >
                View Reputation Explorer
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-semibold text-white/90">Explorer Preview</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-white/10 bg-[#0F1623] p-4">
                <div className="text-xs text-white/60">Reputation Score</div>
                <div className="mt-1 text-2xl font-semibold">84.4 (A)</div>
              </div>
              <div className="h-40 rounded-xl border border-white/10 bg-[#0F1623]" />
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl border border-white/10 bg-[#0F1623] p-4">
                  <div className="text-xs text-white/60">30d Uptime</div>
                  <div className="mt-1 font-semibold">99.94%</div>
                </div>
                <div className="flex-1 rounded-xl border border-white/10 bg-[#0F1623] p-4">
                  <div className="text-xs text-white/60">Incidents</div>
                  <div className="mt-1 font-semibold">1 minor</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="how" className="mt-16" />
      </div>
    </section>
  );
}

