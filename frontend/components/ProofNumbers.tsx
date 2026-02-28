export default function ProofNumbers() {
  const stats = [
    { label: "Protocols monitored", value: "0" },
    { label: "Compensation workflows executed", value: "0 USDC" },
    { label: "Endpoints watched", value: "0" },
  ];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-[#0F1623] p-6">
              <div className="text-xs uppercase tracking-wide text-white/50">{s.label}</div>
              <div className="mt-2 text-3xl font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

