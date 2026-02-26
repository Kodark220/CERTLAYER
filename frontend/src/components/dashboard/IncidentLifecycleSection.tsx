"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Incident Lifecycle (Admin)</CardTitle>
        <CardDescription>Create incident, attach affected users, challenge/dispute, finalize, payout batch.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Incident ID</Label>
            <Input value={form.incidentId} onChange={(e) => onFieldChange("incidentId", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Start TS (unix)</Label>
            <Input value={form.startTs} onChange={(e) => onFieldChange("startTs", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Evidence Hash</Label>
            <Input value={form.evidenceHash} onChange={(e) => onFieldChange("evidenceHash", e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onCreateIncident} disabled={loading}>
            {loading ? "Running..." : "1) Create Incident"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Wallets CSV</Label>
            <Input value={form.walletsCsv} onChange={(e) => onFieldChange("walletsCsv", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amounts CSV</Label>
            <Input value={form.amountsCsv} onChange={(e) => onFieldChange("amountsCsv", e.target.value)} />
          </div>
        </div>
        <Button variant="outline" onClick={onAttachAffectedUsers} disabled={loading}>
          {loading ? "Running..." : "2) Attach Affected Users"}
        </Button>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Challenge Ends TS</Label>
            <Input value={form.challengeEndsTs} onChange={(e) => onFieldChange("challengeEndsTs", e.target.value)} />
          </div>
        </div>
        <Button variant="outline" onClick={onOpenChallenge} disabled={loading}>
          {loading ? "Running..." : "3) Open Challenge Window"}
        </Button>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Dispute Wallet</Label>
            <Input value={form.disputeWallet} onChange={(e) => onFieldChange("disputeWallet", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Dispute Evidence Hash</Label>
            <Input value={form.disputeEvidenceHash} onChange={(e) => onFieldChange("disputeEvidenceHash", e.target.value)} />
          </div>
        </div>
        <Button variant="outline" onClick={onRaiseDispute} disabled={loading}>
          {loading ? "Running..." : "4) Raise Dispute (optional)"}
        </Button>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Dispute Decision</Label>
            <Select value={form.disputeDecision} onValueChange={(value) => onFieldChange("disputeDecision", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">approved</SelectItem>
                <SelectItem value="rejected">rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onResolveDispute} disabled={loading}>
            {loading ? "Running..." : "5) Resolve Dispute (optional)"}
          </Button>
          <Button variant="outline" onClick={onFinalizeIncident} disabled={loading}>
            {loading ? "Running..." : "6) Finalize Incident"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Payout Start Index</Label>
            <Input value={form.payoutStartIndex} onChange={(e) => onFieldChange("payoutStartIndex", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payout Limit</Label>
            <Input value={form.payoutLimit} onChange={(e) => onFieldChange("payoutLimit", e.target.value)} />
          </div>
        </div>
        <Button variant="outline" onClick={onExecutePayoutBatch} disabled={loading}>
          {loading ? "Running..." : "7) Execute Payout Batch"}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {log.length > 0 ? (
          <div className="space-y-2">
            <Label>Lifecycle Log</Label>
            <div className="space-y-2">
              {log.map((line, idx) => (
                <div key={`${line}-${idx}`} className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 font-mono text-xs text-muted-foreground">
                  {line}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

