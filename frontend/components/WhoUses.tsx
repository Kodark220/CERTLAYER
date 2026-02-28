export default function WhoUses() {
  const users = [
    { title: "RPC Providers", desc: "Guarantee uptime and attract institutional integrations." },
    { title: "DeFi Protocols", desc: "Offer automated compensation and increase user trust." },
    { title: "Bridges & Infrastructure", desc: "Turn reliability into measurable public reputation." },
  ];

  return (
    <section className="border-t border-white/10 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold">Who Uses CertLayer</h2>
        <p className="mt-3 max-w-2xl text-white/70">
          Built for infrastructure teams that need provable reliability.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {users.map((u) => (
            <div key={u.title} className="rounded-xl border border-white/10 bg-[#0F1623] p-6">
              <div className="text-lg font-semibold">{u.title}</div>
              <p className="mt-3 text-sm text-white/70">{u.desc}</p>
            </div>
          ))}
        </div>

        <div id="explorer" className="mt-16" />
      </div>
    </section>
  );
}

