import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  const steps = [
    {
      num: "1",
      title: "Connect Your Wallet",
      desc: "Sign in with your wallet to authenticate your identity and link it to your protocol.",
    },
    {
      num: "2",
      title: "Register Your Protocol",
      desc: "Provide your protocol name, type, contract address, and target uptime in the dashboard.",
    },
    {
      num: "3",
      title: "Fund Coverage Pool",
      desc: "Deposit USDC into your coverage pool to back your reliability commitments.",
    },
    {
      num: "4",
      title: "Enable Hack Detection",
      desc: "Register your contract address for AI-powered on-chain threat monitoring via GenLayer.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Register Your Protocol</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
          Onboard your protocol to CertLayer in minutes. Publish enforceable reliability commitments,
          enable AI-powered security monitoring, and build public trust through transparent reputation scoring.
        </p>

        <div className="mt-12 grid gap-5">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-5 rounded-xl border border-white/10 bg-[#0F1623] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2A76F6]/15 text-sm font-bold text-[#2A76F6]">
                {s.num}
              </div>
              <div>
                <div className="text-base font-semibold">{s.title}</div>
                <p className="mt-1 text-sm text-white/65">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/signin"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#2A76F6] px-6 text-sm font-semibold hover:bg-[#1f63d5]"
          >
            Sign In to Get Started
          </Link>
          <Link
            href="/explorer"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-sm font-semibold text-white/90 hover:border-white/25 hover:text-white"
          >
            View Explorer
          </Link>
        </div>
      </div>
    </main>
  );
}

