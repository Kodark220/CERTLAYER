"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { injected } from "wagmi/connectors";
import { useDisconnect } from "wagmi";
import { useAccount, useConnect, useSignMessage } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CommitmentsSection } from "@/src/components/dashboard/CommitmentsSection";
import { IncidentLifecycleSection } from "@/src/components/dashboard/IncidentLifecycleSection";
import { ProtocolRegistrationSection } from "@/src/components/dashboard/ProtocolRegistrationSection";
import { SecurityRecoverySection } from "@/src/components/dashboard/SecurityRecoverySection";
import { UptimeChart } from "@/src/components/dashboard/UptimeChart";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { PageShell } from "@/src/components/layout/PageShell";

import type { AuthSession, CommitmentForm, LifecycleForm, RegisterForm, SecurityForm } from "@/src/types/dashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

const initialRegisterForm: RegisterForm = { id: "", name: "", website: "", protocolType: "rpc", uptimeBps: "9990" };

const initialLifecycleForm: LifecycleForm = {
  incidentId: "",
  startTs: "",
  evidenceHash: "",
  walletsCsv: "",
  amountsCsv: "",
  challengeEndsTs: "",
  disputeWallet: "",
  disputeEvidenceHash: "",
  disputeDecision: "approved",
  payoutStartIndex: "0",
  payoutLimit: "20",
};

const initialCommitmentForm: CommitmentForm = {
  commitmentId: "",
  commitmentType: "governance",
  sourceUrl: "",
  commitmentTextHash: "",
  deadlineTs: "",
  verificationRule: "",
  result: "fulfilled",
  evidenceHash: "",
};

const initialSecurityForm: SecurityForm = {
  incidentId: "",
  startTs: "",
  evidenceHash: "",
  lastCleanBlock: "",
  triggerSourcesCsv: "",
  walletsCsv: "",
  lossesCsv: "",
  recoveryAmount: "",
  recoveryStartIndex: "0",
  recoveryLimit: "20",
  responseSpeed: "0",
  communicationQuality: "0",
  poolAdequacy: "0",
  postMortemQuality: "0",
  recoveryEffort: "0",
};

function MetricCard({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="space-y-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">{value}</CardTitle>
        {meta ? (
          <div>
            <Badge variant="secondary" className="text-xs">
              {meta}
            </Badge>
          </div>
        ) : null}
      </CardHeader>
    </Card>
  );
}

async function postJson(path: string, body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (PUBLIC_API_KEY) headers["x-api-key"] = PUBLIC_API_KEY;
  return fetch(`${API_BASE_URL}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
}

export default function DashboardPage() {
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const { connectAsync } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [tab, setTab] = useState<"protocol" | "incidents" | "commitments" | "security">("protocol");

  const [registerForm, setRegisterForm] = useState<RegisterForm>(initialRegisterForm);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [walletConfirmLoading, setWalletConfirmLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerTxHash, setRegisterTxHash] = useState("");
  const [activeProtocolId, setActiveProtocolId] = useState("");

  const [lifecycleForm, setLifecycleForm] = useState<LifecycleForm>(initialLifecycleForm);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleError, setLifecycleError] = useState("");
  const [lifecycleLog, setLifecycleLog] = useState<string[]>([]);

  const [commitmentForm, setCommitmentForm] = useState<CommitmentForm>(initialCommitmentForm);
  const [commitmentLoading, setCommitmentLoading] = useState(false);
  const [commitmentError, setCommitmentError] = useState("");
  const [commitmentLog, setCommitmentLog] = useState<string[]>([]);

  const [securityForm, setSecurityForm] = useState<SecurityForm>(initialSecurityForm);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securityLog, setSecurityLog] = useState<string[]>([]);

  const canSeeInternalControls = useMemo(() => session?.role === "admin", [session]);

  useEffect(() => {
    const saved = localStorage.getItem("certlayer_session_token");
    if (!saved) {
      setSessionReady(true);
      return;
    }

    fetch(`${API_BASE_URL}/v1/auth/me`, { headers: { Authorization: `Bearer ${saved}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error("Session expired");
        const me = await r.json();
        setSession({ token: saved, wallet: me.wallet, role: me.role, expiresAt: me.expiresAt });
      })
      .catch(() => localStorage.removeItem("certlayer_session_token"))
      .finally(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    if (!canSeeInternalControls && tab !== "protocol") {
      setTab("protocol");
    }
  }, [canSeeInternalControls, tab]);

  function signOut() {
    disconnect();
    localStorage.removeItem("certlayer_session_token");
    setSession(null);
  }

  function setRegisterField(field: keyof RegisterForm, value: string) {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  }

  function setLifecycleField(field: keyof LifecycleForm, value: string) {
    setLifecycleForm((prev) => ({ ...prev, [field]: value }));
  }

  function setCommitmentField(field: keyof CommitmentForm, value: string) {
    setCommitmentForm((prev) => ({ ...prev, [field]: value }));
  }

  function setSecurityField(field: keyof SecurityForm, value: string) {
    setSecurityForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitProtocolRegistration() {
    if (!session) return setRegisterError("Please sign in first.");
    setRegisterError("");
    setRegisterSuccess("");
    setRegisterTxHash("");
    setRegisterLoading(true);

    try {
      const res = await postJson(
        "/v1/protocols/register",
        {
          id: registerForm.id || undefined,
          name: registerForm.name,
          website: registerForm.website,
          protocolType: registerForm.protocolType,
          uptimeBps: Number(registerForm.uptimeBps),
        },
        session.token
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      const suffix = data.mode === "local" ? " (local mode: on-chain write disabled)" : "";
      setRegisterSuccess(`Protocol registered: ${data.protocol.id}${suffix}`);
      setActiveProtocolId(data.protocol.id);
      setRegisterTxHash(data.onchain?.txHash || "");
      setRegisterForm((prev) => ({ ...prev, id: "" }));
    } catch (e) {
      setRegisterError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  }

  async function submitProtocolRegistrationWithWalletConfirm() {
    if (!session) return setRegisterError("Please sign in first.");
    setRegisterError("");
    setWalletConfirmLoading(true);
    try {
      let wallet = address as string | undefined;
      if (!wallet) {
        const connected = await connectAsync({ connector: injected() });
        wallet = connected.accounts?.[0];
      }
      if (!wallet) throw new Error("No wallet selected");

      const confirmationMessage = [
        "CertLayer Registration Confirmation",
        `Wallet: ${wallet}`,
        `Protocol: ${registerForm.name || "(unnamed)"}`,
        `Website: ${registerForm.website || "(none)"}`,
        `Type: ${registerForm.protocolType}`,
        `Uptime BPS: ${registerForm.uptimeBps}`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join("\n");

      await signMessageAsync({ message: confirmationMessage });
      await submitProtocolRegistration();
    } catch (e) {
      setRegisterError(e instanceof Error ? e.message : "Wallet confirmation failed");
    } finally {
      setWalletConfirmLoading(false);
    }
  }

  async function runLifecycleAction(path: string, payload: Record<string, unknown>, label: string) {
    if (!session) return setLifecycleError("Please sign in first.");
    const protocolId = activeProtocolId.trim();
    if (!protocolId) return setLifecycleError("Set or register a Protocol ID first.");

    setLifecycleError("");
    setLifecycleLoading(true);

    try {
      const res = await postJson(path, { ...payload, protocolId }, session.token);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${label} failed`);
      const tx = data.onchain?.txHash ? ` tx=${data.onchain.txHash}` : "";
      setLifecycleLog((prev) => [`${label} success${tx}`, ...prev].slice(0, 20));
      if (path === "/v1/incidents/create-lifecycle" && data.incidentId) {
        setLifecycleField("incidentId", data.incidentId);
      }
    } catch (e) {
      setLifecycleError(e instanceof Error ? e.message : `${label} failed`);
    } finally {
      setLifecycleLoading(false);
    }
  }

  async function runCommitmentAction(path: string, payload: Record<string, unknown>, label: string) {
    if (!session || !canSeeInternalControls) return setCommitmentError("Admin session required.");
    const protocolId = activeProtocolId.trim();
    if (!protocolId) return setCommitmentError("Set Active Protocol ID first.");

    setCommitmentError("");
    setCommitmentLoading(true);

    try {
      const res = await postJson(path, { ...payload, protocolId }, session.token);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${label} failed`);
      const tx = data.onchain?.txHash ? ` tx=${data.onchain.txHash}` : "";
      setCommitmentLog((prev) => [`${label} success${tx}`, ...prev].slice(0, 20));
    } catch (e) {
      setCommitmentError(e instanceof Error ? e.message : `${label} failed`);
    } finally {
      setCommitmentLoading(false);
    }
  }

  async function runSecurityAction(path: string, payload: Record<string, unknown>, label: string) {
    if (!session || !canSeeInternalControls) return setSecurityError("Admin session required.");
    const protocolId = activeProtocolId.trim();
    if (!protocolId) return setSecurityError("Set Active Protocol ID first.");

    setSecurityError("");
    setSecurityLoading(true);

    try {
      const res = await postJson(path, { ...payload, protocolId }, session.token);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${label} failed`);
      const tx = data.onchain?.txHash ? ` tx=${data.onchain.txHash}` : "";
      setSecurityLog((prev) => [`${label} success${tx}`, ...prev].slice(0, 20));
      if (path === "/v1/security-incidents/create" && data.incidentId) {
        setSecurityField("incidentId", data.incidentId);
      }
    } catch (e) {
      setSecurityError(e instanceof Error ? e.message : `${label} failed`);
    } finally {
      setSecurityLoading(false);
    }
  }

  if (!sessionReady) {
    return (
      <PageShell>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Loading session...</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!session) {
    return (
      <PageShell>
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>You need a wallet-authenticated session to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild>
              <Link href="/signin">Go to Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back Home</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Protocol Dashboard"
        description="Private operational view for protocol teams."
        status="Live Monitoring"
        meta={
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Signed in: <span className="font-mono">{session.wallet}</span> ({session.role})
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Reputation Score" value="78.4 (A)" meta="Updated 2 min ago" />
        <MetricCard label="Coverage Pool" value="245,000 USDC" />
        <MetricCard label="30d Uptime" value="99.82% ↑" />
        <MetricCard label="Compensation Paid" value="12,430 USDC" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Uptime Trend (90d)</CardTitle>
          <CardDescription>Reliability trend preview for internal operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <UptimeChart />
        </CardContent>
      </Card>

      <div className="my-1 h-px bg-border/70" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "protocol" | "incidents" | "commitments" | "security")} className="w-full">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="protocol">Register Protocol</TabsTrigger>
          {canSeeInternalControls ? <TabsTrigger value="incidents">Incident Lifecycle</TabsTrigger> : null}
          {canSeeInternalControls ? <TabsTrigger value="commitments">Commitments</TabsTrigger> : null}
          {canSeeInternalControls ? <TabsTrigger value="security">Security Response</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="protocol" className="mt-4">
          <ProtocolRegistrationSection
            form={registerForm}
            onFieldChange={setRegisterField}
            onSubmit={submitProtocolRegistration}
            onSubmitWithWalletConfirm={submitProtocolRegistrationWithWalletConfirm}
            loading={registerLoading}
            walletConfirmLoading={walletConfirmLoading}
            success={registerSuccess}
            txHash={registerTxHash}
            error={registerError}
            canSeeInternalControls={canSeeInternalControls}
            activeProtocolId={activeProtocolId}
            onActiveProtocolIdChange={setActiveProtocolId}
          />
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          {canSeeInternalControls ? (
            <IncidentLifecycleSection
              form={lifecycleForm}
              onFieldChange={setLifecycleField}
              loading={lifecycleLoading}
              error={lifecycleError}
              log={lifecycleLog}
              onCreateIncident={() =>
                runLifecycleAction(
                  "/v1/incidents/create-lifecycle",
                  {
                    incidentId: lifecycleForm.incidentId || undefined,
                    startTs: lifecycleForm.startTs ? Number(lifecycleForm.startTs) : undefined,
                    evidenceHash: lifecycleForm.evidenceHash,
                  },
                  "Create incident"
                )
              }
              onAttachAffectedUsers={() =>
                runLifecycleAction(
                  "/v1/incidents/affected-users",
                  {
                    incidentId: lifecycleForm.incidentId,
                    walletsCsv: lifecycleForm.walletsCsv,
                    amountsCsv: lifecycleForm.amountsCsv,
                  },
                  "Attach affected users"
                )
              }
              onOpenChallenge={() =>
                runLifecycleAction(
                  "/v1/incidents/challenge/open",
                  {
                    incidentId: lifecycleForm.incidentId,
                    challengeEndsTs: Number(lifecycleForm.challengeEndsTs),
                  },
                  "Open challenge window"
                )
              }
              onRaiseDispute={() =>
                runLifecycleAction(
                  "/v1/incidents/dispute",
                  {
                    incidentId: lifecycleForm.incidentId,
                    wallet: lifecycleForm.disputeWallet,
                    evidenceHash: lifecycleForm.disputeEvidenceHash,
                  },
                  "Raise dispute"
                )
              }
              onResolveDispute={() =>
                runLifecycleAction(
                  "/v1/incidents/dispute/resolve",
                  {
                    incidentId: lifecycleForm.incidentId,
                    wallet: lifecycleForm.disputeWallet,
                    decision: lifecycleForm.disputeDecision,
                  },
                  "Resolve dispute"
                )
              }
              onFinalizeIncident={() =>
                runLifecycleAction("/v1/incidents/finalize", { incidentId: lifecycleForm.incidentId }, "Finalize incident")
              }
              onExecutePayoutBatch={() =>
                runLifecycleAction(
                  "/v1/incidents/payout-batch",
                  {
                    incidentId: lifecycleForm.incidentId,
                    startIndex: Number(lifecycleForm.payoutStartIndex || 0),
                    limit: Number(lifecycleForm.payoutLimit || 20),
                  },
                  "Execute payout batch"
                )
              }
            />
          ) : null}
        </TabsContent>

        <TabsContent value="commitments" className="mt-4">
          {canSeeInternalControls ? (
            <CommitmentsSection
              form={commitmentForm}
              onFieldChange={setCommitmentField}
              loading={commitmentLoading}
              error={commitmentError}
              log={commitmentLog}
              onRegister={() =>
                runCommitmentAction(
                  "/v1/commitments/register",
                  {
                    commitmentId: commitmentForm.commitmentId,
                    commitmentType: commitmentForm.commitmentType,
                    sourceUrl: commitmentForm.sourceUrl,
                    commitmentTextHash: commitmentForm.commitmentTextHash,
                    deadlineTs: Number(commitmentForm.deadlineTs),
                    verificationRule: commitmentForm.verificationRule,
                  },
                  "Register commitment"
                )
              }
              onEvaluate={() =>
                runCommitmentAction(
                  "/v1/commitments/evaluate",
                  {
                    commitmentId: commitmentForm.commitmentId,
                    result: commitmentForm.result,
                    evidenceHash: commitmentForm.evidenceHash,
                  },
                  "Evaluate commitment"
                )
              }
              onSubmitEvidence={() =>
                runCommitmentAction(
                  "/v1/commitments/evidence",
                  {
                    commitmentId: commitmentForm.commitmentId,
                    evidenceHash: commitmentForm.evidenceHash,
                  },
                  "Submit fulfillment evidence"
                )
              }
              onFinalize={() =>
                runCommitmentAction("/v1/commitments/finalize", { commitmentId: commitmentForm.commitmentId }, "Finalize commitment")
              }
            />
          ) : null}
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          {canSeeInternalControls ? (
            <SecurityRecoverySection
              form={securityForm}
              onFieldChange={setSecurityField}
              loading={securityLoading}
              error={securityError}
              log={securityLog}
              onCreateSecurityIncident={() =>
                runSecurityAction(
                  "/v1/security-incidents/create",
                  {
                    incidentId: securityForm.incidentId || undefined,
                    startTs: securityForm.startTs ? Number(securityForm.startTs) : undefined,
                    evidenceHash: securityForm.evidenceHash,
                    lastCleanBlock: Number(securityForm.lastCleanBlock || 0),
                    triggerSourcesCsv: securityForm.triggerSourcesCsv,
                  },
                  "Create security incident"
                )
              }
              onAttachLossSnapshot={() =>
                runSecurityAction(
                  "/v1/security-incidents/loss-snapshot",
                  {
                    incidentId: securityForm.incidentId,
                    walletsCsv: securityForm.walletsCsv,
                    lossesCsv: securityForm.lossesCsv,
                  },
                  "Attach loss snapshot"
                )
              }
              onSetHackScores={() =>
                runSecurityAction(
                  "/v1/security-incidents/response-score",
                  {
                    incidentId: securityForm.incidentId,
                    responseSpeed: Number(securityForm.responseSpeed || 0),
                    communicationQuality: Number(securityForm.communicationQuality || 0),
                    poolAdequacy: Number(securityForm.poolAdequacy || 0),
                    postMortemQuality: Number(securityForm.postMortemQuality || 0),
                    recoveryEffort: Number(securityForm.recoveryEffort || 0),
                  },
                  "Set hack response scores"
                )
              }
            />
          ) : null}
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/explorer">Open Public Explorer</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back Home</Link>
            </Button>
            <Button onClick={signOut}>Sign Out</Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
