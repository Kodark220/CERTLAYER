"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegisterForm } from "../../types/dashboard";

type Props = {
  form: RegisterForm;
  onFieldChange: (field: keyof RegisterForm, value: string) => void;
  onSubmit: () => void;
  onSubmitWithWalletConfirm: () => void;
  loading: boolean;
  walletConfirmLoading: boolean;
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
  onSubmitWithWalletConfirm,
  loading,
  walletConfirmLoading,
  success,
  txHash,
  error,
  canSeeInternalControls,
  activeProtocolId,
  onActiveProtocolIdChange,
}: Props) {
  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Register Protocol</CardTitle>
        <CardDescription>Owner wallet is taken from your signed session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Protocol ID (optional)</Label>
            <Input value={form.id} onChange={(e) => onFieldChange("id", e.target.value)} placeholder="proto-my-service" />
          </div>
          <div className="space-y-2">
            <Label>Protocol Name</Label>
            <Input value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} placeholder="My Protocol" />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e) => onFieldChange("website", e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Protocol Type</Label>
            <Select value={form.protocolType} onValueChange={(value) => onFieldChange("protocolType", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rpc">RPC</SelectItem>
                <SelectItem value="bridge">Bridge</SelectItem>
                <SelectItem value="defi">DeFi</SelectItem>
                <SelectItem value="oracle">Oracle</SelectItem>
                <SelectItem value="l2">L2</SelectItem>
                <SelectItem value="infra">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Uptime Target (bps)</Label>
            <Input value={form.uptimeBps} onChange={(e) => onFieldChange("uptimeBps", e.target.value)} placeholder="9990" />
          </div>
          {canSeeInternalControls ? (
            <div className="space-y-2">
              <Label>Active Protocol ID (for admin lifecycle actions)</Label>
              <Input value={activeProtocolId} onChange={(e) => onActiveProtocolIdChange(e.target.value)} placeholder="proto-my-service" />
            </div>
          ) : null}
        </div>
        <Button onClick={onSubmitWithWalletConfirm} disabled={loading || walletConfirmLoading}>
          {loading || walletConfirmLoading ? "Submitting..." : "Register Protocol"}
        </Button>
        {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
        {txHash ? <p className="break-all font-mono text-xs text-muted-foreground">Tx Hash: {txHash}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
