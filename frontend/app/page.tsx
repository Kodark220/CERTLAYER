"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CommitmentsSection } from "../src/components/dashboard/CommitmentsSection";
import { IncidentLifecycleSection } from "../src/components/dashboard/IncidentLifecycleSection";
import { ProtocolRegistrationSection } from "../src/components/dashboard/ProtocolRegistrationSection";
import { SecurityRecoverySection } from "../src/components/dashboard/SecurityRecoverySection";
import {
  AuthSession,
  CommitmentForm,
  LifecycleForm,
  Mode,
  RegisterForm,
  SecurityForm,
  View,
} from "../src/types/dashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

const initialRegisterForm: RegisterForm = {
  id: "",
  name: "",
  website: "",
  protocolType: "rpc",
  uptimeBps: "9990",
};

const initialLifecycleForm: LifecycleForm = {
  incidentId: "",
  startTs: "",
  evidenceHash: "",
  walletsCsv: "",
  amountsCsv: "",
  challengeEndsTs: "",
  disputeWallet: "",
  disputeEvidenceHash: "",
  disputeDecision: "approved",
  payoutStartIndex: "0",
  payoutLimit: "20",
};

const initialCommitmentForm: CommitmentForm = {
  commitmentId: "",
  commitmentType: "governance",
  sourceUrl: "",
  commitmentTextHash: "",
  deadlineTs: "",
  verificationRule: "",
  result: "fulfilled",
  evidenceHash: "",
};

const initialSecurityForm: SecurityForm = {
  incidentId: "",
  startTs: "",
  evidenceHash: "",
  lastCleanBlock: "",
  triggerSourcesCsv: "",
  walletsCsv: "",
  lossesCsv: "",
  recoveryAmount: "",
  recoveryStartIndex: "0",
  recoveryLimit: "20",
  responseSpeed: "0",
  communicationQuality: "0",
  poolAdequacy: "0",
  postMortemQuality: "0",
  recoveryEffort: "0",
};

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("wallet");
  const [view, setView] = useState<View>("landing");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);

  const [registerForm, setRegisterForm] = useState<RegisterForm>(initialRegisterForm);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerTxHash, setRegisterTxHash] = useState("");
  const [activeProtocolId, setActiveProtocolId] = useState("");

  const [lifecycleForm, setLifecycleForm] = useState<LifecycleForm>(initialLifecycleForm);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleError, setLifecycleError] = useState("");
  const [lifecycleLog, setLifecycleLog] = useState<string[]>([]);

  const [commitmentForm, setCommitmentForm] = useState<CommitmentForm>(initialCommitmentForm);
  const [commitmentLoading, setCommitmentLoading] = useState(false);
  const [commitmentError, setCommitmentError] = useState("");
  const [commitmentLog, setCommitmentLog] = useState<string[]>([]);

  const [securityForm, setSecurityForm] = useState<SecurityForm>(initialSecurityForm);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securityLog, setSecurityLog] = useState<string[]>([]);

  const headline = useMemo(() => "You verify. You trigger. You enforce.", []);
  const canSeeInternalControls = session?.role === "admin";

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

  function setRegisterField(field: keyof RegisterForm, value: string) {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  }

  function setLifecycleField(field: keyof LifecycleForm, value: string) {
    setLifecycleForm((prev) => ({ ...prev, [field]: value }));
  }

  function setCommitmentField(field: keyof CommitmentForm, value: string) {
    setCommitmentForm((prev) => ({ ...prev, [field]: value }));
  }

  function setSecurityField(field: keyof SecurityForm, value: string) {
    setSecurityForm((prev) => ({ ...prev, [field]: value }));
  }

  async function postJson(path: string, body: Record<string, unknown>, token?: string) {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (PUBLIC_API_KEY) headers["x-api-key"] = PUBLIC_API_KEY;
    return fetch(`${API_BASE_URL}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  }

  async function signInWithMetaMask() {
    setAuthError("");
    setLoadingAuth(true);
    try {
      const ethereum = (window as { ethereum?: { request: (arg: unknown) => Promise<unknown> } }).ethereum;
      if (!ethereum) throw new Error("MetaMask is not installed");

      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const wallet = accounts[0];
      if (!wallet) throw new Error("No wallet selected");

      const nonceRes = await postJson("/v1/auth/wallet/nonce", { wallet });
      if (!nonceRes.ok) {
        const e = await nonceRes.json();
        throw new Error(e.error || "Failed to request nonce");
      }
      const nonceData = await nonceRes.json();

      const signature = (await ethereum.request({
        method: "personal_sign",
        params: [nonceData.message, wallet],
      })) as string;

      const verifyRes = await postJson("/v1/auth/wallet/verify", { wallet, signature });
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
      setAuthError(error instanceof Error ? error.message : "Authentication failed");
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
      const res = await postJson(
        "/v1/protocols/register",
        {
          id: registerForm.id || undefined,
          name: registerForm.name,
          website: registerForm.website,
          protocolType: registerForm.protocolType,
          uptimeBps: Number(registerForm.uptimeBps),
        },
        session.token
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setRegisterSuccess(`Protocol registered: ${data.protocol.id}`);
      setActiveProtocolId(data.protocol.id);
      setRegisterTxHash(data.onchain?.txHash || "");
      setRegisterForm((prev) => ({ ...prev, id: "" }));
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  }

  async function runLifecycleAction(path: string, payload: Record<string, unknown>, label: string) {
    if (!session) {
      setLifecycleError("Please sign in first.");
      return;
    }
    const protocolId = activeProtocolId.trim();
    if (!protocolId) {
      setLifecycleError("Set or register a Protocol ID first.");
      return;
    }
    setLifecycleError("");
    setLifecycleLoading(true);
    try {
      const res = await postJson(path, { ...payload, protocolId }, session.token);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${label} failed`);
      const tx = data.onchain?.txHash ? ` tx=${data.onchain.txHash}` : "";
      setLifecycleLog((prev) => [`${label} success${tx}`, ...prev].slice(0, 20));
      if (path === "/v1/incidents/create-lifecycle" && data.incidentId) {
        setLifecycleField("incidentId", data.incidentId);
      }
    } catch (error) {
      setLifecycleError(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setLifecycleLoading(false);
    }
  }

  async function runCommitmentAction(path: string, payload: Record<string, unknown>, label: string) {
    if (!session || !canSeeInternalControls) {
      setCommitmentError("Admin session required.");
      return;
    }
    const protocolId = activeProtocolId.trim();
    if (!protocolId) {
      setCommitmentError("Set Active Protocol ID first.");
      return;
    }
    setCommitmentError("");
    setCommitmentLoading(true);
    try {
      const res = await postJson(path, { ...payload, protocolId }, session.token);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${label} failed`);
      const tx = data.onchain?.txHash ? ` tx=${data.onchain.txHash}` : "";
      setCommitmentLog((prev) => [`${label} success${tx}`, ...prev].slice(0, 20));
    } catch (error) {
      setCommitmentError(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setCommitmentLoading(false);
    }
  }

  async function runSecurityAction(path: string, payload: Record<string, unknown>, label: string) {
    if (!session || !canSeeInternalControls) {
      setSecurityError("Admin session required.");
      return;
    }
    const protocolId = activeProtocolId.trim();
    if (!protocolId) {
      setSecurityError("Set Active Protocol ID first.");
      return;
    }
    setSecurityError("");
    setSecurityLoading(true);
    try {
      const res = await postJson(path, { ...payload, protocolId }, session.token);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${label} failed`);
      const tx = data.onchain?.txHash ? ` tx=${data.onchain.txHash}` : "";
      setSecurityLog((prev) => [`${label} success${tx}`, ...prev].slice(0, 20));
      if (path === "/v1/security-incidents/create" && data.incidentId) {
        setSecurityField("incidentId", data.incidentId);
      }
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setSecurityLoading(false);
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

        <ProtocolRegistrationSection
          form={registerForm}
          onFieldChange={setRegisterField}
          onSubmit={submitProtocolRegistration}
          loading={registerLoading}
          success={registerSuccess}
          txHash={registerTxHash}
          error={registerError}
          canSeeInternalControls={canSeeInternalControls}
          activeProtocolId={activeProtocolId}
          onActiveProtocolIdChange={setActiveProtocolId}
        />

        {canSeeInternalControls ? (
          <IncidentLifecycleSection
            form={lifecycleForm}
            onFieldChange={setLifecycleField}
            loading={lifecycleLoading}
            error={lifecycleError}
            log={lifecycleLog}
            onCreateIncident={() =>
              runLifecycleAction(
                "/v1/incidents/create-lifecycle",
                {
                  incidentId: lifecycleForm.incidentId || undefined,
                  startTs: lifecycleForm.startTs ? Number(lifecycleForm.startTs) : undefined,
                  evidenceHash: lifecycleForm.evidenceHash,
                },
                "Create incident"
              )
            }
            onAttachAffectedUsers={() =>
              runLifecycleAction(
                "/v1/incidents/affected-users",
                {
                  incidentId: lifecycleForm.incidentId,
                  walletsCsv: lifecycleForm.walletsCsv,
                  amountsCsv: lifecycleForm.amountsCsv,
                },
                "Attach affected users"
              )
            }
            onOpenChallenge={() =>
              runLifecycleAction(
                "/v1/incidents/challenge/open",
                {
                  incidentId: lifecycleForm.incidentId,
                  challengeEndsTs: Number(lifecycleForm.challengeEndsTs),
                },
                "Open challenge window"
              )
            }
            onRaiseDispute={() =>
              runLifecycleAction(
                "/v1/incidents/dispute",
                {
                  incidentId: lifecycleForm.incidentId,
                  wallet: lifecycleForm.disputeWallet,
                  evidenceHash: lifecycleForm.disputeEvidenceHash,
                },
                "Raise dispute"
              )
            }
            onResolveDispute={() =>
              runLifecycleAction(
                "/v1/incidents/dispute/resolve",
                {
                  incidentId: lifecycleForm.incidentId,
                  wallet: lifecycleForm.disputeWallet,
                  decision: lifecycleForm.disputeDecision,
                },
                "Resolve dispute"
              )
            }
            onFinalizeIncident={() =>
              runLifecycleAction("/v1/incidents/finalize", { incidentId: lifecycleForm.incidentId }, "Finalize incident")
            }
            onExecutePayoutBatch={() =>
              runLifecycleAction(
                "/v1/incidents/payout-batch",
                {
                  incidentId: lifecycleForm.incidentId,
                  startIndex: Number(lifecycleForm.payoutStartIndex || 0),
                  limit: Number(lifecycleForm.payoutLimit || 20),
                },
                "Execute payout batch"
              )
            }
          />
        ) : null}

        {canSeeInternalControls ? (
          <CommitmentsSection
            form={commitmentForm}
            onFieldChange={setCommitmentField}
            loading={commitmentLoading}
            error={commitmentError}
            log={commitmentLog}
            onRegister={() =>
              runCommitmentAction(
                "/v1/commitments/register",
                {
                  commitmentId: commitmentForm.commitmentId,
                  commitmentType: commitmentForm.commitmentType,
                  sourceUrl: commitmentForm.sourceUrl,
                  commitmentTextHash: commitmentForm.commitmentTextHash,
                  deadlineTs: Number(commitmentForm.deadlineTs),
                  verificationRule: commitmentForm.verificationRule,
                },
                "Register commitment"
              )
            }
            onEvaluate={() =>
              runCommitmentAction(
                "/v1/commitments/evaluate",
                {
                  commitmentId: commitmentForm.commitmentId,
                  result: commitmentForm.result,
                  evidenceHash: commitmentForm.evidenceHash,
                },
                "Evaluate commitment"
              )
            }
            onSubmitEvidence={() =>
              runCommitmentAction(
                "/v1/commitments/evidence",
                {
                  commitmentId: commitmentForm.commitmentId,
                  evidenceHash: commitmentForm.evidenceHash,
                },
                "Submit fulfillment evidence"
              )
            }
            onFinalize={() =>
              runCommitmentAction(
                "/v1/commitments/finalize",
                { commitmentId: commitmentForm.commitmentId },
                "Finalize commitment"
              )
            }
          />
        ) : null}

        {canSeeInternalControls ? (
          <SecurityRecoverySection
            form={securityForm}
            onFieldChange={setSecurityField}
            loading={securityLoading}
            error={securityError}
            log={securityLog}
            onCreateSecurityIncident={() =>
              runSecurityAction(
                "/v1/security-incidents/create",
                {
                  incidentId: securityForm.incidentId || undefined,
                  startTs: securityForm.startTs ? Number(securityForm.startTs) : undefined,
                  evidenceHash: securityForm.evidenceHash,
                  lastCleanBlock: Number(securityForm.lastCleanBlock || 0),
                  triggerSourcesCsv: securityForm.triggerSourcesCsv,
                },
                "Create security incident"
              )
            }
            onAttachLossSnapshot={() =>
              runSecurityAction(
                "/v1/security-incidents/loss-snapshot",
                {
                  incidentId: securityForm.incidentId,
                  walletsCsv: securityForm.walletsCsv,
                  lossesCsv: securityForm.lossesCsv,
                },
                "Attach loss snapshot"
              )
            }
            onRecordRecovery={() =>
              runSecurityAction(
                "/v1/security-incidents/recovery/record",
                {
                  incidentId: securityForm.incidentId,
                  amount: Number(securityForm.recoveryAmount || 0),
                },
                "Record recovery"
              )
            }
            onDistributeRecoveryBatch={() =>
              runSecurityAction(
                "/v1/security-incidents/recovery/distribute",
                {
                  incidentId: securityForm.incidentId,
                  startIndex: Number(securityForm.recoveryStartIndex || 0),
                  limit: Number(securityForm.recoveryLimit || 20),
                },
                "Distribute recovery batch"
              )
            }
            onSetHackScores={() =>
              runSecurityAction(
                "/v1/security-incidents/response-score",
                {
                  incidentId: securityForm.incidentId,
                  responseSpeed: Number(securityForm.responseSpeed || 0),
                  communicationQuality: Number(securityForm.communicationQuality || 0),
                  poolAdequacy: Number(securityForm.poolAdequacy || 0),
                  postMortemQuality: Number(securityForm.postMortemQuality || 0),
                  recoveryEffort: Number(securityForm.recoveryEffort || 0),
                },
                "Set hack response scores"
              )
            }
          />
        ) : null}

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
            Protocols pay you to hold them accountable. Users are compensated automatically when SLA breaches are
            verified.
          </p>
          <div className="grid" style={{ marginTop: 12 }}>
            <div className="kpi">Protocols monitored<strong>0</strong></div>
            <div className="kpi">Compensation executed<strong>0 USDC</strong></div>
            <div className="kpi">Endpoints watched<strong>0</strong></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href="/explorer">
              <button>View Public Reputation Explorer</button>
            </Link>
          </div>
        </article>

        <article className="card">
          <h2>Sign In</h2>
          <p>Access protocol dashboard or API portal.</p>
          {session ? <p style={{ fontSize: 13, color: "#a9bdd4" }}>Session active for {session.wallet}</p> : null}

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
