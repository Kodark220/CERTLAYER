export default function CompensationFlow() {
  const flow = [
    { title: "Protocols Register Commitments", desc: "Teams define uptime and trust commitments and fund coverage pools." },
    { title: "Failures Are Verified", desc: "Incidents are detected and validated using independent evidence sources." },
    {
      title: "Enforcement + Reputation Updates",
      desc: "Compensation workflows are triggered and protocol reputation is updated publicly.",
    },
  ];

  return (
    <section className="border-t border-white/10 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold">How Compensation Workflows Are Triggered</h2>
        <p className="mt-3 max-w-2xl text-white/70">Verifiable, policy-driven, and transparent.</p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {flow.map((f) => (
            <div key={f.title} className="rounded-xl border border-white/10 bg-[#0F1623] p-6">
              <div className="text-lg font-semibold">{f.title}</div>
              <p className="mt-3 text-sm text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

