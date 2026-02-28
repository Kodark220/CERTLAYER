"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommitmentForm } from "../../types/dashboard";

const verificationRuleTemplates = [
  { id: "uptime_30d", type: "uptime", label: "Uptime 30d >= 9990", rule: "30d uptime_bps >= 9990" },
  { id: "uptime_downtime", type: "uptime", label: "Monthly downtime <= 43", rule: "monthly_downtime_minutes <= 43" },
  { id: "security_ack", type: "security", label: "Critical ack <= 30m", rule: "critical_incident_ack_minutes <= 30" },
  { id: "security_postmortem", type: "security", label: "Postmortem <= 72h", rule: "postmortem_published_within_hours <= 72" },
  { id: "security_patch", type: "security", label: "Patch <= 24h", rule: "security_patch_released_within_hours <= 24" },
  {
    id: "communication_status",
    type: "communication",
    label: "Status update every <= 60m",
    rule: "status_updates_posted_every_minutes <= 60 during_incident == true",
  },
  {
    id: "communication_notice",
    type: "communication",
    label: "Incident notice <= 15m",
    rule: "incident_notice_published_within_minutes <= 15",
  },
  { id: "financial_pool", type: "financial", label: "Pool >= 250000", rule: "coverage_pool_balance_usdc >= 250000" },
  {
    id: "financial_report",
    type: "financial",
    label: "Treasury report by deadline",
    rule: "treasury_report_published_by_deadline == true",
  },
  {
    id: "governance_vote",
    type: "governance",
    label: "Governance vote by deadline",
    rule: "governance_vote_executed_by_deadline == true",
  },
  {
    id: "governance_status",
    type: "governance",
    label: "Proposal status finalized",
    rule: "proposal_status in [approved, rejected] by_deadline == true",
  },
  {
    id: "roadmap_alpha",
    type: "roadmap",
    label: "Alpha milestone by deadline",
    rule: "milestone_alpha_released_by_deadline == true",
  },
  {
    id: "roadmap_completion",
    type: "roadmap",
    label: "Feature completion 100%",
    rule: "feature_set_completion_percent >= 100 by_deadline == true",
  },
];

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
  const availableTemplates = verificationRuleTemplates.filter((t) => t.type === form.commitmentType);

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Commitments (Admin)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Commitment ID</Label>
            <Input value={form.commitmentId} onChange={(e) => onFieldChange("commitmentId", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.commitmentType} onValueChange={(value) => onFieldChange("commitmentType", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uptime">uptime</SelectItem>
                <SelectItem value="governance">governance</SelectItem>
                <SelectItem value="roadmap">roadmap</SelectItem>
                <SelectItem value="financial">financial</SelectItem>
                <SelectItem value="security">security</SelectItem>
                <SelectItem value="communication">communication</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Source URL</Label>
            <Input value={form.sourceUrl} onChange={(e) => onFieldChange("sourceUrl", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Commitment Text Hash</Label>
            <Input value={form.commitmentTextHash} onChange={(e) => onFieldChange("commitmentTextHash", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="1000"
              value={form.amount}
              onChange={(e) => onFieldChange("amount", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Asset</Label>
            <Input
              placeholder="USDC"
              value={form.asset}
              onChange={(e) => onFieldChange("asset", e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-2">
            <Label>Deadline TS</Label>
            <Input value={form.deadlineTs} onChange={(e) => onFieldChange("deadlineTs", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Verification Rule</Label>
            <Input value={form.verificationRule} onChange={(e) => onFieldChange("verificationRule", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Verification Rule Template</Label>
            <Select
              onValueChange={(value) => {
                const selected = verificationRuleTemplates.find((t) => t.id === value);
                if (selected) onFieldChange("verificationRule", selected.rule);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a template to auto-fill verification rule" />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label}
                  </SelectItem>
                ))}
                {availableTemplates.length === 0 ? (
                  <SelectItem value="no_template_available" disabled>
                    No templates for selected type
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={onRegister} disabled={loading}>
          {loading ? "Running..." : "Register Commitment"}
        </Button>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Evaluate Result</Label>
            <Select value={form.result} onValueChange={(value) => onFieldChange("result", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fulfilled">fulfilled</SelectItem>
                <SelectItem value="partial">partial</SelectItem>
                <SelectItem value="missed">missed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Evidence Hash</Label>
            <Input value={form.evidenceHash} onChange={(e) => onFieldChange("evidenceHash", e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onEvaluate} disabled={loading}>
            {loading ? "Running..." : "Evaluate Commitment"}
          </Button>
          <Button variant="outline" onClick={onSubmitEvidence} disabled={loading}>
            {loading ? "Running..." : "Submit Grace Evidence"}
          </Button>
          <Button variant="outline" onClick={onFinalize} disabled={loading}>
            {loading ? "Running..." : "Finalize Commitment"}
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {log.length > 0 ? (
          <div className="space-y-2">
            <Label>Commitment Log</Label>
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
