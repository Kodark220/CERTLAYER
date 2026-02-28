"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SecurityForm } from "../../types/dashboard";

type Props = {
  form: SecurityForm;
  onFieldChange: (field: keyof SecurityForm, value: string) => void;
  loading: boolean;
  error: string;
  log: string[];
  onCreateSecurityIncident: () => void;
  onAttachLossSnapshot: () => void;
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
  onSetHackScores,
}: Props) {
  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Security Incident Response (Admin)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Security Incident ID</Label>
            <Input value={form.incidentId} onChange={(e) => onFieldChange("incidentId", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Start TS</Label>
            <Input value={form.startTs} onChange={(e) => onFieldChange("startTs", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Evidence Hash</Label>
            <Input value={form.evidenceHash} onChange={(e) => onFieldChange("evidenceHash", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Last Clean Block</Label>
            <Input value={form.lastCleanBlock} onChange={(e) => onFieldChange("lastCleanBlock", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Trigger Sources CSV</Label>
            <Input value={form.triggerSourcesCsv} onChange={(e) => onFieldChange("triggerSourcesCsv", e.target.value)} placeholder="official,peckshield" />
          </div>
        </div>
        <Button onClick={onCreateSecurityIncident} disabled={loading}>
          {loading ? "Running..." : "Create Security Incident"}
        </Button>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Loss Wallets CSV</Label>
            <Input value={form.walletsCsv} onChange={(e) => onFieldChange("walletsCsv", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Loss Amounts CSV</Label>
            <Input value={form.lossesCsv} onChange={(e) => onFieldChange("lossesCsv", e.target.value)} />
          </div>
        </div>
        <Button variant="outline" onClick={onAttachLossSnapshot} disabled={loading}>
          {loading ? "Running..." : "Attach Loss Snapshot"}
        </Button>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Response Speed</Label>
            <Input value={form.responseSpeed} onChange={(e) => onFieldChange("responseSpeed", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Communication Quality</Label>
            <Input value={form.communicationQuality} onChange={(e) => onFieldChange("communicationQuality", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Pool Adequacy</Label>
            <Input value={form.poolAdequacy} onChange={(e) => onFieldChange("poolAdequacy", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Post-Mortem Quality</Label>
            <Input value={form.postMortemQuality} onChange={(e) => onFieldChange("postMortemQuality", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Recovery Effort</Label>
            <Input value={form.recoveryEffort} onChange={(e) => onFieldChange("recoveryEffort", e.target.value)} />
          </div>
        </div>
        <Button variant="outline" onClick={onSetHackScores} disabled={loading}>
          {loading ? "Running..." : "Set Hack Response Scores"}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {log.length > 0 ? (
          <div className="space-y-2">
            <Label>Security Log</Label>
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
