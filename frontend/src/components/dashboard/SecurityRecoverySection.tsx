"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  onRegisterHackDetection: () => void;
  onAnalyzeTransaction: () => void;
  onCheckRiskScore: () => void;
  onCheckSecurityStatus: () => void;
  securityStatus: { paused: boolean } | null;
  riskScoreResult: { txHash: string; score: number } | null;
  analysisResult: { txHash: string; analysis: string } | null;
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
  onRegisterHackDetection,
  onAnalyzeTransaction,
  onCheckRiskScore,
  onCheckSecurityStatus,
  securityStatus,
  riskScoreResult,
  analysisResult,
}: Props) {
  return (
    <div className="space-y-6">
    {/* ── Hack Detection Registration & Monitoring ── */}
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Hack Detection</CardTitle>
        <CardDescription>Register your protocol for AI-powered security monitoring, analyze transactions, and check risk scores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Register protocol */}
        <div className="space-y-2">
          <Label>Protocol Contract Address</Label>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={form.hackDetectionAddress}
              onChange={(e) => onFieldChange("hackDetectionAddress", e.target.value)}
              placeholder="0x... (your protocol's contract address)"
            />
            <Button onClick={onRegisterHackDetection} disabled={loading}>
              {loading ? "Registering..." : "Register for Hack Detection"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Registers your protocol address with the HackDetection intelligent contract for on-chain AI threat monitoring.
          </p>
        </div>

        {/* Global status */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onCheckSecurityStatus} disabled={loading}>
            Check Global Status
          </Button>
          {securityStatus !== null ? (
            <Badge variant={securityStatus.paused ? "destructive" : "secondary"}>
              {securityStatus.paused ? "PAUSED — Threat Active" : "Active — No Threats"}
            </Badge>
          ) : null}
        </div>

        {/* Analyze transaction */}
        <div className="space-y-2 rounded-md border border-border/50 p-4">
          <Label className="text-sm font-medium">Analyze a Transaction</Label>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Transaction Data</Label>
              <Input
                value={form.analyzeTxData}
                onChange={(e) => onFieldChange("analyzeTxData", e.target.value)}
                placeholder="Raw transaction data or description"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Transaction Hash</Label>
              <Input
                value={form.analyzeTxHash}
                onChange={(e) => onFieldChange("analyzeTxHash", e.target.value)}
                placeholder="0x..."
              />
            </div>
          </div>
          <Button variant="outline" onClick={onAnalyzeTransaction} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Transaction"}
          </Button>
          {analysisResult ? (
            <div className="rounded-md border border-border/70 bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Analysis for {analysisResult.txHash}</p>
              <p className="mt-1 text-sm">{analysisResult.analysis || "No analysis available"}</p>
            </div>
          ) : null}
        </div>

        {/* Risk score lookup */}
        <div className="space-y-2 rounded-md border border-border/50 p-4">
          <Label className="text-sm font-medium">Check Risk Score</Label>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={form.riskScoreTxHash}
              onChange={(e) => onFieldChange("riskScoreTxHash", e.target.value)}
              placeholder="Transaction hash to look up"
            />
            <Button variant="outline" onClick={onCheckRiskScore} disabled={loading}>
              {loading ? "Checking..." : "Check Score"}
            </Button>
          </div>
          {riskScoreResult ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Risk Score:</span>
              <Badge variant={riskScoreResult.score >= 70 ? "destructive" : "secondary"}>
                {riskScoreResult.score} / 100
              </Badge>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>

    {/* ── Existing: Security Incident Response ── */}
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
    </div>
  );
}
