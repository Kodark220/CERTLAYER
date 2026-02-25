"use client";

import { RegisterForm } from "../../types/dashboard";

type Props = {
  form: RegisterForm;
  onFieldChange: (field: keyof RegisterForm, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  success: string;
  txHash: string;
  error: string;
  canSeeInternalControls: boolean;
  activeProtocolId: string;
  onActiveProtocolIdChange: (value: string) => void;
};

export function ProtocolRegistrationSection({
  form,
  onFieldChange,
  onSubmit,
  loading,
  success,
  txHash,
  error,
  canSeeInternalControls,
  activeProtocolId,
  onActiveProtocolIdChange,
}: Props) {
  return (
    <section className="card">
      <h3>Register Protocol</h3>
      <p>Owner wallet is taken from your signed session.</p>
      <div className="grid">
        <div>
          <label className="label">Protocol ID (optional)</label>
          <input
            value={form.id}
            onChange={(e) => onFieldChange("id", e.target.value)}
            placeholder="proto-my-service"
          />
        </div>
        <div>
          <label className="label">Protocol Name</label>
          <input
            value={form.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="My Protocol"
          />
        </div>
        <div>
          <label className="label">Website</label>
          <input
            value={form.website}
            onChange={(e) => onFieldChange("website", e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div>
          <label className="label">Protocol Type</label>
          <select
            value={form.protocolType}
            onChange={(e) => onFieldChange("protocolType", e.target.value)}
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
            value={form.uptimeBps}
            onChange={(e) => onFieldChange("uptimeBps", e.target.value)}
            placeholder="9990"
          />
        </div>
        <button onClick={onSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Register Protocol On-Chain"}
        </button>
        {success ? <p style={{ color: "#a8f0bf", fontSize: 13 }}>{success}</p> : null}
        {txHash ? (
          <p style={{ fontSize: 12, color: "#9eb4cc", wordBreak: "break-all" }}>
            Tx Hash: {txHash}
          </p>
        ) : null}
        {canSeeInternalControls ? (
          <div>
            <label className="label">Active Protocol ID (for admin lifecycle actions)</label>
            <input
              value={activeProtocolId}
              onChange={(e) => onActiveProtocolIdChange(e.target.value)}
              placeholder="proto-my-service"
            />
          </div>
        ) : null}
        {error ? <p style={{ color: "#ff9d9d", fontSize: 13 }}>{error}</p> : null}
      </div>
    </section>
  );
}
