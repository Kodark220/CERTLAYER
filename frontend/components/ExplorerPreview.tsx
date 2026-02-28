export default function ExplorerPreview() {
  const rows = [
    { name: "Example RPC", type: "RPC", score: "84.4", grade: "A", uptime: "99.94%", incidents: "1", status: "Live" },
    { name: "Example DeFi", type: "DeFi", score: "78.2", grade: "B", uptime: "99.71%", incidents: "2", status: "Live" },
    {
      name: "Example Bridge",
      type: "Bridge",
      score: "72.5",
      grade: "B-",
      uptime: "99.52%",
      incidents: "3",
      status: "Monitoring",
    },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold">Public Reputation Explorer</h2>
        <p className="mt-3 max-w-2xl text-white/70">Verify protocol reliability before integrating.</p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#0F1623]">
          <div className="border-b border-white/10 px-6 py-4 text-sm font-semibold text-white/85">Preview</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-white/50">
                  {["Protocol", "Type", "Score", "Grade", "30d Uptime", "Incidents", "Status"].map((h) => (
                    <th key={h} className="px-6 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-white/80">
                {rows.map((r) => (
                  <tr key={r.name} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-6 py-4 font-medium text-white">{r.name}</td>
                    <td className="px-6 py-4">{r.type}</td>
                    <td className="px-6 py-4">{r.score}</td>
                    <td className="px-6 py-4">{r.grade}</td>
                    <td className="px-6 py-4">{r.uptime}</td>
                    <td className="px-6 py-4">{r.incidents}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div id="docs" className="mt-16" />
      </div>
    </section>
  );
}

