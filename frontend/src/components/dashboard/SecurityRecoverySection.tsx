"use client";

import { SecurityForm } from "../../types/dashboard";

type Props = {
  form: SecurityForm;
  onFieldChange: (field: keyof SecurityForm, value: string) => void;
  loading: boolean;
  error: string;
  log: string[];
  onCreateSecurityIncident: () => void;
  onAttachLossSnapshot: () => void;
  onRecordRecovery: () => void;
  onDistributeRecoveryBatch: () => void;
  onSetHackScores: () => void;
};

export function SecurityRecoverySection({
  form,
  onFieldChange,
  loading,
  error,
  log,
  onCreateSecurityIncident,
  onAttachLossSnapshot,
  onRecordRecovery,
  onDistributeRecoveryBatch,
  onSetHackScores,
}: Props) {
  return (
    <section className="card">
      <h3>Security & Recovery (Admin)</h3>
      <div className="grid">
        <div>
          <label className="label">Security Incident ID</label>
          <input value={form.incidentId} onChange={(e) => onFieldChange("incidentId", e.target.value)} />
        </div>
        <div>
          <label className="label">Start TS</label>
          <input value={form.startTs} onChange={(e) => onFieldChange("startTs", e.target.value)} />
        </div>
        <div>
          <label className="label">Evidence Hash</label>
          <input value={form.evidenceHash} onChange={(e) => onFieldChange("evidenceHash", e.target.value)} />
        </div>
        <div>
          <label className="label">Last Clean Block</label>
          <input value={form.lastCleanBlock} onChange={(e) => onFieldChange("lastCleanBlock", e.target.value)} />
        </div>
        <div>
          <label className="label">Trigger Sources CSV</label>
          <input
            value={form.triggerSourcesCsv}
            onChange={(e) => onFieldChange("triggerSourcesCsv", e.target.value)}
            placeholder="official,peckshield"
          />
        </div>
        <button disabled={loading} onClick={onCreateSecurityIncident}>
          {loading ? "Running..." : "Create Security Incident"}
        </button>

        <div>
          <label className="label">Loss Wallets CSV</label>
          <input value={form.walletsCsv} onChange={(e) => onFieldChange("walletsCsv", e.target.value)} />
        </div>
        <div>
          <label className="label">Loss Amounts CSV</label>
          <input value={form.lossesCsv} onChange={(e) => onFieldChange("lossesCsv", e.target.value)} />
        </div>
        <button disabled={loading} onClick={onAttachLossSnapshot}>
          {loading ? "Running..." : "Attach Loss Snapshot"}
        </button>

        <div>
          <label className="label">Recovery Amount</label>
          <input value={form.recoveryAmount} onChange={(e) => onFieldChange("recoveryAmount", e.target.value)} />
        </div>
        <button disabled={loading} onClick={onRecordRecovery}>{loading ? "Running..." : "Record Recovery"}</button>

        <div>
          <label className="label">Recovery Start Index</label>
          <input
            value={form.recoveryStartIndex}
            onChange={(e) => onFieldChange("recoveryStartIndex", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Recovery Limit</label>
          <input value={form.recoveryLimit} onChange={(e) => onFieldChange("recoveryLimit", e.target.value)} />
        </div>
        <button disabled={loading} onClick={onDistributeRecoveryBatch}>
          {loading ? "Running..." : "Distribute Recovery Batch"}
        </button>

        <div>
          <label className="label">Response Speed</label>
          <input value={form.responseSpeed} onChange={(e) => onFieldChange("responseSpeed", e.target.value)} />
        </div>
        <div>
          <label className="label">Communication Quality</label>
          <input
            value={form.communicationQuality}
            onChange={(e) => onFieldChange("communicationQuality", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Pool Adequacy</label>
          <input value={form.poolAdequacy} onChange={(e) => onFieldChange("poolAdequacy", e.target.value)} />
        </div>
        <div>
          <label className="label">Post-Mortem Quality</label>
          <input
            value={form.postMortemQuality}
            onChange={(e) => onFieldChange("postMortemQuality", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Recovery Effort</label>
          <input value={form.recoveryEffort} onChange={(e) => onFieldChange("recoveryEffort", e.target.value)} />
        </div>
        <button disabled={loading} onClick={onSetHackScores}>
          {loading ? "Running..." : "Set Hack Response Scores"}
        </button>

        {error ? <p style={{ color: "#ff9d9d", fontSize: 13 }}>{error}</p> : null}
        {log.length > 0 ? (
          <div>
            <label className="label">Security Log</label>
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
