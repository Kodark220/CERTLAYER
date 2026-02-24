"use client";

import { useEffect, useMemo, useState } from "react";

type Mode = "wallet" | "email";
type View = "landing" | "protocol" | "api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type AuthSession = {
  token: string;
  wallet: string;
  role: string;
  expiresAt: string;
};

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("wallet");
  const [view, setView] = useState<View>("landing");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [registerForm, setRegisterForm] = useState({
    id: "",
    name: "",
    website: "",
    protocolType: "rpc",
    uptimeBps: "9990",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerTxHash, setRegisterTxHash] = useState("");

  const headline = useMemo(
    () => "You verify. You trigger. You enforce.",
    []
  );

  useEffect(() => {
    const saved = localStorage.getItem("certlayer_session_token");
    if (!saved) return;

    fetch(`${API_BASE_URL}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${saved}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Session expired");
        const me = await r.json();
        setSession({
          token: saved,
          wallet: me.wallet,
          role: me.role,
          expiresAt: me.expiresAt,
        });
      })
      .catch(() => {
        localStorage.removeItem("certlayer_session_token");
      });
  }, []);

  async function signInWithMetaMask() {
    setAuthError("");
    setLoadingAuth(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error("MetaMask is not installed");
      }

      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const wallet = accounts[0];
      if (!wallet) {
        throw new Error("No wallet selected");
      }

      const nonceRes = await fetch(`${API_BASE_URL}/v1/auth/wallet/nonce`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      if (!nonceRes.ok) {
        const e = await nonceRes.json();
        throw new Error(e.error || "Failed to request nonce");
      }
      const nonceData = await nonceRes.json();

      const signature = await ethereum.request({
        method: "personal_sign",
        params: [nonceData.message, wallet],
      });

      const verifyRes = await fetch(`${API_BASE_URL}/v1/auth/wallet/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet, signature }),
      });
      if (!verifyRes.ok) {
        const e = await verifyRes.json();
        throw new Error(e.error || "Wallet verification failed");
      }
      const verifyData = await verifyRes.json();
      localStorage.setItem("certlayer_session_token", verifyData.token);
      setSession({
        token: verifyData.token,
        wallet: verifyData.wallet,
        role: verifyData.role,
        expiresAt: verifyData.expiresAt,
      });
      setView("protocol");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setAuthError(message);
    } finally {
      setLoadingAuth(false);
    }
  }

  function signOut() {
    localStorage.removeItem("certlayer_session_token");
    setSession(null);
    setView("landing");
  }

  function openProtectedView(nextView: View) {
    if (!session) {
      setAuthError("Please sign in with wallet first.");
      return;
    }
    setView(nextView);
  }

  async function submitProtocolRegistration() {
    if (!session) {
      setRegisterError("Please sign in first.");
      return;
    }
    setRegisterError("");
    setRegisterSuccess("");
    setRegisterTxHash("");
    setRegisterLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/protocols/register`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          id: registerForm.id || undefined,
          name: registerForm.name,
          website: registerForm.website,
          protocolType: registerForm.protocolType,
          uptimeBps: Number(registerForm.uptimeBps),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      setRegisterSuccess(`Protocol registered: ${data.protocol.id}`);
      setRegisterTxHash(data.onchain?.txHash || "");
      setRegisterForm((prev) => ({ ...prev, id: "" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      setRegisterError(message);
    } finally {
      setRegisterLoading(false);
    }
  }

  if (view === "protocol") {
    return (
      <main className="shell grid" style={{ gap: 18 }}>
        <section className="card">
          <h1>Protocol Dashboard</h1>
          <p>Private operational view for protocol teams.</p>
          {session ? (
            <p style={{ color: "#a9bdd4", fontSize: 13 }}>
              Signed in: {session.wallet} ({session.role})
            </p>
          ) : null}
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
        </section>
        <section className="card">
          <h3>Register Protocol</h3>
          <p>Owner wallet is taken from your signed session.</p>
          <div className="grid">
            <div>
              <label className="label">Protocol ID (optional)</label>
              <input
                value={registerForm.id}
                onChange={(e) => setRegisterForm((p) => ({ ...p, id: e.target.value }))}
                placeholder="proto-my-service"
              />
            </div>
            <div>
              <label className="label">Protocol Name</label>
              <input
                value={registerForm.name}
                onChange={(e) => setRegisterForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="My Protocol"
              />
            </div>
            <div>
              <label className="label">Website</label>
              <input
                value={registerForm.website}
                onChange={(e) => setRegisterForm((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="label">Protocol Type</label>
              <select
                value={registerForm.protocolType}
                onChange={(e) => setRegisterForm((p) => ({ ...p, protocolType: e.target.value }))}
              >
                <option value="rpc">RPC</option>
                <option value="bridge">Bridge</option>
                <option value="defi">DeFi</option>
                <option value="oracle">Oracle</option>
                <option value="l2">L2</option>
                <option value="infra">Infrastructure</option>
              </select>
            </div>
            <div>
              <label className="label">Uptime Target (bps)</label>
              <input
                value={registerForm.uptimeBps}
                onChange={(e) => setRegisterForm((p) => ({ ...p, uptimeBps: e.target.value }))}
                placeholder="9990"
              />
            </div>
            <button onClick={submitProtocolRegistration} disabled={registerLoading}>
              {registerLoading ? "Submitting..." : "Register Protocol On-Chain"}
            </button>
            {registerSuccess ? <p style={{ color: "#a8f0bf", fontSize: 13 }}>{registerSuccess}</p> : null}
            {registerTxHash ? (
              <p style={{ fontSize: 12, color: "#9eb4cc", wordBreak: "break-all" }}>
                Tx Hash: {registerTxHash}
              </p>
            ) : null}
            {registerError ? <p style={{ color: "#ff9d9d", fontSize: 13 }}>{registerError}</p> : null}
          </div>
        </section>
        <section className="card">
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setView("landing")}>Back</button>
            <button onClick={signOut}>Sign Out</button>
          </div>
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
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setView("landing")}>Back</button>
            <button onClick={signOut}>Sign Out</button>
          </div>
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
          {session ? (
            <p style={{ fontSize: 13, color: "#a9bdd4" }}>
              Session active for {session.wallet}
            </p>
          ) : null}

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={() => setMode("wallet")}>Wallet</button>
            <button onClick={() => setMode("email")}>Email</button>
          </div>

          {mode === "wallet" ? (
            <div className="grid">
              <button onClick={signInWithMetaMask} disabled={loadingAuth}>
                {loadingAuth ? "Signing in..." : "Connect + Sign (MetaMask)"}
              </button>
              <p style={{ fontSize: 12, color: "#9eb4cc" }}>
                Sign a nonce message to authenticate. No transaction required.
              </p>
              {authError ? <p style={{ color: "#ff9d9d", fontSize: 13 }}>{authError}</p> : null}
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
            <button onClick={() => openProtectedView("protocol")}>Open Protocol Dashboard</button>
            <button onClick={() => openProtectedView("api")}>Open API Portal</button>
          </div>
        </article>
      </section>
    </main>
  );
}
