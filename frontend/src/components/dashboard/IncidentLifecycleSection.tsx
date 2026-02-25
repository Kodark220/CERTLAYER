"use client";

import { LifecycleForm } from "../../types/dashboard";

type Props = {
  form: LifecycleForm;
  onFieldChange: (field: keyof LifecycleForm, value: string) => void;
  loading: boolean;
  error: string;
  log: string[];
  onCreateIncident: () => void;
  onAttachAffectedUsers: () => void;
  onOpenChallenge: () => void;
  onRaiseDispute: () => void;
  onResolveDispute: () => void;
  onFinalizeIncident: () => void;
  onExecutePayoutBatch: () => void;
};

export function IncidentLifecycleSection({
  form,
  onFieldChange,
  loading,
  error,
  log,
  onCreateIncident,
  onAttachAffectedUsers,
  onOpenChallenge,
  onRaiseDispute,
  onResolveDispute,
  onFinalizeIncident,
  onExecutePayoutBatch,
}: Props) {
  return (
    <section className="card">
      <h3>Incident Lifecycle (Admin)</h3>
      <p>Create incident, attach affected users, challenge/dispute, finalize, payout batch.</p>
      <div className="grid">
        <div>
          <label className="label">Incident ID</label>
          <input value={form.incidentId} onChange={(e) => onFieldChange("incidentId", e.target.value)} />
        </div>
        <div>
          <label className="label">Start TS (unix)</label>
          <input value={form.startTs} onChange={(e) => onFieldChange("startTs", e.target.value)} />
        </div>
        <div>
          <label className="label">Evidence Hash</label>
          <input value={form.evidenceHash} onChange={(e) => onFieldChange("evidenceHash", e.target.value)} />
        </div>
        <button disabled={loading} onClick={onCreateIncident}>{loading ? "Running..." : "1) Create Incident"}</button>

        <div>
          <label className="label">Wallets CSV</label>
          <input value={form.walletsCsv} onChange={(e) => onFieldChange("walletsCsv", e.target.value)} />
        </div>
        <div>
          <label className="label">Amounts CSV</label>
          <input value={form.amountsCsv} onChange={(e) => onFieldChange("amountsCsv", e.target.value)} />
        </div>
        <button disabled={loading} onClick={onAttachAffectedUsers}>
          {loading ? "Running..." : "2) Attach Affected Users"}
        </button>

        <div>
          <label className="label">Challenge Ends TS</label>
          <input
            value={form.challengeEndsTs}
            onChange={(e) => onFieldChange("challengeEndsTs", e.target.value)}
          />
        </div>
        <button disabled={loading} onClick={onOpenChallenge}>
          {loading ? "Running..." : "3) Open Challenge Window"}
        </button>

        <div>
          <label className="label">Dispute Wallet</label>
          <input value={form.disputeWallet} onChange={(e) => onFieldChange("disputeWallet", e.target.value)} />
        </div>
        <div>
          <label className="label">Dispute Evidence Hash</label>
          <input
            value={form.disputeEvidenceHash}
            onChange={(e) => onFieldChange("disputeEvidenceHash", e.target.value)}
          />
        </div>
        <button disabled={loading} onClick={onRaiseDispute}>
          {loading ? "Running..." : "4) Raise Dispute (optional)"}
        </button>

        <div>
          <label className="label">Dispute Decision</label>
          <select value={form.disputeDecision} onChange={(e) => onFieldChange("disputeDecision", e.target.value)}>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
        <button disabled={loading} onClick={onResolveDispute}>
          {loading ? "Running..." : "5) Resolve Dispute (optional)"}
        </button>

        <button disabled={loading} onClick={onFinalizeIncident}>
          {loading ? "Running..." : "6) Finalize Incident"}
        </button>

        <div>
          <label className="label">Payout Start Index</label>
          <input value={form.payoutStartIndex} onChange={(e) => onFieldChange("payoutStartIndex", e.target.value)} />
        </div>
        <div>
          <label className="label">Payout Limit</label>
          <input value={form.payoutLimit} onChange={(e) => onFieldChange("payoutLimit", e.target.value)} />
        </div>
        <button disabled={loading} onClick={onExecutePayoutBatch}>
          {loading ? "Running..." : "7) Execute Payout Batch"}
        </button>

        {error ? <p style={{ color: "#ff9d9d", fontSize: 13 }}>{error}</p> : null}
        {log.length > 0 ? (
          <div>
            <label className="label">Lifecycle Log</label>
            <div className="grid">
              {log.map((line, idx) => (
                <div key={`${line}-${idx}`} className="kpi" style={{ fontSize: 12 }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
