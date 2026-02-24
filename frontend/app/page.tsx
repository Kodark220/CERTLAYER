"use client";

import { useMemo, useState } from "react";

type Mode = "wallet" | "email";
type View = "landing" | "protocol" | "api";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("wallet");
  const [view, setView] = useState<View>("landing");

  const headline = useMemo(
    () => "You verify. You trigger. You enforce.",
    []
  );

  if (view === "protocol") {
    return (
      <main className="shell grid" style={{ gap: 18 }}>
        <section className="card">
          <h1>Protocol Dashboard</h1>
          <p>Private operational view for protocol teams.</p>
        </section>
        <section className="grid grid-2">
          <div className="kpi">Reputation Score<strong>78.4 (A)</strong></div>
          <div className="kpi">Coverage Pool<strong>245,000 USDC</strong></div>
          <div className="kpi">30d Uptime<strong>99.82%</strong></div>
          <div className="kpi">Compensation Paid<strong>12,430 USDC</strong></div>
        </section>
        <section className="card">
          <h3>Next modules</h3>
          <p>Incidents, Coverage Pool, Reputation Breakdown, API Access, Team Roles.</p>
          <button onClick={() => setView("landing")}>Back</button>
        </section>
      </main>
    );
  }

  if (view === "api") {
    return (
      <main className="shell grid" style={{ gap: 18 }}>
        <section className="card">
          <h1>API Portal</h1>
          <p>For funds, analysts, and partners buying reputation data.</p>
        </section>
        <section className="card">
          <h3>Key Management</h3>
          <p>Generate, rotate, and revoke keys. Monitor usage and billing.</p>
          <button onClick={() => setView("landing")}>Back</button>
        </section>
      </main>
    );
  }

  return (
    <main className="shell grid" style={{ gap: 18 }}>
      <section className="grid grid-2">
        <article className="card">
          <h1>CertLayer</h1>
          <p>{headline}</p>
          <p>
            Protocols pay you to hold them accountable. Users are compensated automatically when
            SLA breaches are verified.
          </p>
          <div className="grid" style={{ marginTop: 12 }}>
            <div className="kpi">Protocols monitored<strong>0</strong></div>
            <div className="kpi">Compensation executed<strong>0 USDC</strong></div>
            <div className="kpi">Endpoints watched<strong>0</strong></div>
          </div>
        </article>

        <article className="card">
          <h2>Sign In</h2>
          <p>Access protocol dashboard or API portal.</p>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={() => setMode("wallet")}>Wallet</button>
            <button onClick={() => setMode("email")}>Email</button>
          </div>

          {mode === "wallet" ? (
            <div className="grid">
              <button>Connect Wallet (MetaMask)</button>
              <button>Connect Wallet (WalletConnect)</button>
              <p style={{ fontSize: 12, color: "#9eb4cc" }}>
                Sign a nonce message to authenticate. No transaction required.
              </p>
            </div>
          ) : (
            <div className="grid">
              <div>
                <label className="label">Email</label>
                <input placeholder="you@company.com" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" placeholder="********" />
              </div>
              <button>Sign In</button>
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button onClick={() => setView("protocol")}>Open Protocol Dashboard</button>
            <button onClick={() => setView("api")}>Open API Portal</button>
          </div>
        </article>
      </section>
    </main>
  );
}
