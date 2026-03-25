export default function CompensationFlow() {
  const steps = [
    {
      step: "01",
      title: "Incident Detected",
      desc: "A verified downtime event or security breach is detected and recorded on-chain with evidence.",
    },
    {
      step: "02",
      title: "Loss Snapshot Attached",
      desc: "Affected wallets and loss amounts are submitted and validated against the incident evidence.",
    },
    {
      step: "03",
      title: "Automated Payout",
      desc: "Compensation is distributed from the protocol's coverage pool to affected users automatically.",
    },
  ];

  return (
    <section className="border-t border-white/10 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold">How Compensation Workflows Are Triggered</h2>
        <p className="mt-3 max-w-2xl text-white/70">
          Every payout is backed by verified evidence and executed through policy-driven smart contracts.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="relative rounded-xl border border-white/10 bg-[#0F1623] p-6">
              <span className="text-4xl font-bold text-[#2A76F6]/20">{s.step}</span>
              <div className="mt-2 text-lg font-semibold">{s.title}</div>
              <p className="mt-3 text-sm text-white/70">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

