"use client";

import { CommitmentForm } from "../../types/dashboard";

type Props = {
  form: CommitmentForm;
  onFieldChange: (field: keyof CommitmentForm, value: string) => void;
  loading: boolean;
  error: string;
  log: string[];
  onRegister: () => void;
  onEvaluate: () => void;
  onSubmitEvidence: () => void;
  onFinalize: () => void;
};

export function CommitmentsSection({
  form,
  onFieldChange,
  loading,
  error,
  log,
  onRegister,
  onEvaluate,
  onSubmitEvidence,
  onFinalize,
}: Props) {
  return (
    <section className="card">
      <h3 className="surface-title">Commitments (Admin)</h3>
      <div className="grid">
        <div>
          <label className="label">Commitment ID</label>
          <input value={form.commitmentId} onChange={(e) => onFieldChange("commitmentId", e.target.value)} />
        </div>
        <div>
          <label className="label">Type</label>
          <select value={form.commitmentType} onChange={(e) => onFieldChange("commitmentType", e.target.value)}>
            <option value="governance">governance</option>
            <option value="roadmap">roadmap</option>
            <option value="financial">financial</option>
            <option value="security">security</option>
            <option value="communication">communication</option>
          </select>
        </div>
        <div>
          <label className="label">Source URL</label>
          <input value={form.sourceUrl} onChange={(e) => onFieldChange("sourceUrl", e.target.value)} />
        </div>
        <div>
          <label className="label">Commitment Text Hash</label>
          <input
            value={form.commitmentTextHash}
            onChange={(e) => onFieldChange("commitmentTextHash", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Deadline TS</label>
          <input value={form.deadlineTs} onChange={(e) => onFieldChange("deadlineTs", e.target.value)} />
        </div>
        <div>
          <label className="label">Verification Rule</label>
          <input value={form.verificationRule} onChange={(e) => onFieldChange("verificationRule", e.target.value)} />
        </div>
        <button className="btn-primary" disabled={loading} onClick={onRegister}>{loading ? "Running..." : "Register Commitment"}</button>

        <div>
          <label className="label">Evaluate Result</label>
          <select value={form.result} onChange={(e) => onFieldChange("result", e.target.value)}>
            <option value="fulfilled">fulfilled</option>
            <option value="partial">partial</option>
            <option value="missed">missed</option>
          </select>
        </div>
        <div>
          <label className="label">Evidence Hash</label>
          <input value={form.evidenceHash} onChange={(e) => onFieldChange("evidenceHash", e.target.value)} />
        </div>
        <button className="btn-secondary" disabled={loading} onClick={onEvaluate}>{loading ? "Running..." : "Evaluate Commitment"}</button>
        <button className="btn-secondary" disabled={loading} onClick={onSubmitEvidence}>
          {loading ? "Running..." : "Submit Grace Evidence"}
        </button>
        <button className="btn-secondary" disabled={loading} onClick={onFinalize}>{loading ? "Running..." : "Finalize Commitment"}</button>

        {error ? <p className="error-text">{error}</p> : null}
        {log.length > 0 ? (
          <div>
            <label className="label">Commitment Log</label>
            <div className="grid">
              {log.map((line, idx) => (
                <div key={`${line}-${idx}`} className="kpi muted" style={{ fontSize: 12 }}>
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
