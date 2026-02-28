"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
            <Label>Deadline TS</Label>
            <Input value={form.deadlineTs} onChange={(e) => onFieldChange("deadlineTs", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Verification Rule</Label>
            <Input value={form.verificationRule} onChange={(e) => onFieldChange("verificationRule", e.target.value)} />
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
