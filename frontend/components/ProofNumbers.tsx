export default function ProofNumbers() {
  const stats = [
    { label: "Protocols onboarded", value: "Live", detail: "Bradbury Testnet" },
    { label: "AI threat analyses", value: "On-chain", detail: "GenLayer Intelligent Contracts" },
    { label: "Compensation engine", value: "Active", detail: "Policy-driven payouts" },
  ];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-[#0F1623] p-6">
              <div className="text-xs uppercase tracking-wide text-white/50">{s.label}</div>
              <div className="mt-2 text-3xl font-semibold">{s.value}</div>
              <div className="mt-1 text-xs text-white/40">{s.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

