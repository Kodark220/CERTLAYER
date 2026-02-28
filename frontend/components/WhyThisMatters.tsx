export default function WhyThisMatters() {
  const bullets = [
    "Most crypto infrastructure operates without enforceable accountability.",
    "Institutions require measurable, verifiable reliability before integrating.",
    "Transparent performance data builds long-term trust and capital inflows.",
  ];

  return (
    <section className="border-t border-white/10 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold">Why This Matters</h2>
        <p className="mt-3 max-w-2xl text-white/70">
          CertLayer makes operational promises measurable and enforceable.
        </p>

        <ul className="mt-10 max-w-2xl list-disc space-y-4 pl-5 text-white/75">
          {bullets.map((b) => (
            <li key={b} className="leading-7">
              {b}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

