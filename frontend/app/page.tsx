"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommitmentsSection } from "../src/components/dashboard/CommitmentsSection";
import { IncidentLifecycleSection } from "../src/components/dashboard/IncidentLifecycleSection";
import { ProtocolRegistrationSection } from "../src/components/dashboard/ProtocolRegistrationSection";
import { SecurityRecoverySection } from "../src/components/dashboard/SecurityRecoverySection";
import { UptimeChart } from "../src/components/dashboard/UptimeChart";
import { PageHeader } from "../src/components/layout/PageHeader";
import { PageShell } from "../src/components/layout/PageShell";
import {
  AuthSession,
  CommitmentForm,
  LifecycleForm,
  Mode,
  RegisterForm,
  SecurityForm,
  View,
} from "../src/types/dashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

const initialRegisterForm: RegisterForm = {
  id: "",
  name: "",
  website: "",
  protocolType: "rpc",
  uptimeBps: "9990",
};

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

function MetricCard({ label, value, meta, primary = false }: { label: string; value: string; meta?: string; primary?: boolean }) {
  return (
    <Card className={`border-border/70 bg-card shadow-sm ${primary ? "md:col-span-2" : ""}`}>
      <CardHeader className="space-y-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">{value}</CardTitle>
        {meta ? (
          <div>
            <Badge variant="secondary" className="border border-border/80 bg-secondary/40 text-xs">
              {meta}
            </Badge>
          </div>
        ) : null}
      </CardHeader>
    </Card>
  );
}

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { connectAsync, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [mode, setMode] = useState<Mode>("wallet");
  const [view, setView] = useState<View>("landing");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);

  const [registerForm, setRegisterForm] = useState<RegisterForm>(initialRegisterForm);
  const [registerLoading, setRegisterLoading] = useState(false);
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

  const headline = useMemo(() => "You verify. You trigger. You enforce.", []);
  const canSeeInternalControls = session?.role === "admin";

  useEffect(() => {
    const saved = localStorage.getItem("certlayer_session_token");
    if (!saved) return;

    fetch(`${API_BASE_URL}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${saved}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Session expired");
        const me = await r.json();
        setSession({
          token: saved,
          wallet: me.wallet,
          role: me.role,
          expiresAt: me.expiresAt,
        });
      })
      .catch(() => {
        localStorage.removeItem("certlayer_session_token");
      });
  }, []);

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

  async function postJson(path: string, body: Record<string, unknown>, token?: string) {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (PUBLIC_API_KEY) headers["x-api-key"] = PUBLIC_API_KEY;
    return fetch(`${API_BASE_URL}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  }

  async function signInWithMetaMask() {
    setAuthError("");
    setLoadingAuth(true);
    try {
      let wallet = address as string | undefined;

      if (!wallet) {
        const connected = await connectAsync({ connector: injected() });
        wallet = connected.accounts?.[0];
      }

      if (!wallet) throw new Error("No wallet selected");

      const nonceRes = await postJson("/v1/auth/wallet/nonce", { wallet });
      if (!nonceRes.ok) {
        const e = await nonceRes.json();
        throw new Error(e.error || "Failed to request nonce");
      }
      const nonceData = await nonceRes.json();

      const signature = await signMessageAsync({
        message: nonceData.message,
      });

      const verifyRes = await postJson("/v1/auth/wallet/verify", { wallet, signature });
      if (!verifyRes.ok) {
        const e = await verifyRes.json();
        throw new Error(e.error || "Wallet verification failed");
      }

      const verifyData = await verifyRes.json();
      localStorage.setItem("certlayer_session_token", verifyData.token);
      setSession({
        token: verifyData.token,
        wallet: verifyData.wallet,
        role: verifyData.role,
        expiresAt: verifyData.expiresAt,
      });
      setView("protocol");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoadingAuth(false);
    }
  }

  function signOut() {
    if (isConnected) disconnect();
    localStorage.removeItem("certlayer_session_token");
    setSession(null);
    setView("landing");
  }

  function openProtectedView(nextView: View) {
    if (!session) {
      setAuthError("Please sign in with wallet first.");
      return;
    }
    setView(nextView);
  }

  async function submitProtocolRegistration() {
    if (!session) {
      setRegisterError("Please sign in first.");
      return;
    }
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
      setRegisterSuccess(`Protocol registered: ${data.protocol.id}`);
      setActiveProtocolId(data.protocol.id);
      setRegisterTxHash(data.onchain?.txHash || "");
      setRegisterForm((prev) => ({ ...prev, id: "" }));
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  }

  async function runLifecycleAction(path: string, payload: Record<string, unknown>, label: string) {
    if (!session) {
      setLifecycleError("Please sign in first.");
      return;
    }
    const protocolId = activeProtocolId.trim();
    if (!protocolId) {
      setLifecycleError("Set or register a Protocol ID first.");
      return;
    }
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
    } catch (error) {
      setLifecycleError(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setLifecycleLoading(false);
    }
  }

  async function runCommitmentAction(path: string, payload: Record<string, unknown>, label: string) {
    if (!session || !canSeeInternalControls) {
      setCommitmentError("Admin session required.");
      return;
    }
    const protocolId = activeProtocolId.trim();
    if (!protocolId) {
      setCommitmentError("Set Active Protocol ID first.");
      return;
    }
    setCommitmentError("");
    setCommitmentLoading(true);
    try {
      const res = await postJson(path, { ...payload, protocolId }, session.token);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${label} failed`);
      const tx = data.onchain?.txHash ? ` tx=${data.onchain.txHash}` : "";
      setCommitmentLog((prev) => [`${label} success${tx}`, ...prev].slice(0, 20));
    } catch (error) {
      setCommitmentError(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setCommitmentLoading(false);
    }
  }

  async function runSecurityAction(path: string, payload: Record<string, unknown>, label: string) {
    if (!session || !canSeeInternalControls) {
      setSecurityError("Admin session required.");
      return;
    }
    const protocolId = activeProtocolId.trim();
    if (!protocolId) {
      setSecurityError("Set Active Protocol ID first.");
      return;
    }
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
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setSecurityLoading(false);
    }
  }

  if (view === "protocol") {
    return (
      <PageShell>
        <PageHeader
          title="Protocol Dashboard"
          description="Private operational view for protocol teams."
          status="Live Monitoring"
          meta={
            session ? (
              <p className="text-sm text-muted-foreground">
                Signed in: <span className="font-mono">{session.wallet}</span> ({session.role})
              </p>
            ) : undefined
          }
        />

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard label="Reputation Score" value="78.4 (A)" meta="Updated 2 min ago" primary />
          <div className="grid gap-4 md:col-span-1">
            <MetricCard label="Coverage Pool" value="245,000 USDC" />
            <MetricCard label="30d Uptime" value="99.82% ↑" />
            <MetricCard label="Compensation Paid" value="12,430 USDC" />
          </div>
        </section>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Next modules</CardTitle>
            <CardDescription>Incidents, Coverage Pool, Reputation Breakdown, API Access, Team Roles.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Uptime Trend (90d)</CardTitle>
            <CardDescription>Reliability trend preview for internal operations.</CardDescription>
          </CardHeader>
          <CardContent>
            <UptimeChart />
          </CardContent>
        </Card>

        <ProtocolRegistrationSection
          form={registerForm}
          onFieldChange={setRegisterField}
          onSubmit={submitProtocolRegistration}
          loading={registerLoading}
          success={registerSuccess}
          txHash={registerTxHash}
          error={registerError}
          canSeeInternalControls={canSeeInternalControls}
          activeProtocolId={activeProtocolId}
          onActiveProtocolIdChange={setActiveProtocolId}
        />

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
              runCommitmentAction(
                "/v1/commitments/finalize",
                { commitmentId: commitmentForm.commitmentId },
                "Finalize commitment"
              )
            }
          />
        ) : null}

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
            onRecordRecovery={() =>
              runSecurityAction(
                "/v1/security-incidents/recovery/record",
                {
                  incidentId: securityForm.incidentId,
                  amount: Number(securityForm.recoveryAmount || 0),
                },
                "Record recovery"
              )
            }
            onDistributeRecoveryBatch={() =>
              runSecurityAction(
                "/v1/security-incidents/recovery/distribute",
                {
                  incidentId: securityForm.incidentId,
                  startIndex: Number(securityForm.recoveryStartIndex || 0),
                  limit: Number(securityForm.recoveryLimit || 20),
                },
                "Distribute recovery batch"
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

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setView("landing")}>
                Back
              </Button>
              <Button onClick={signOut}>Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (view === "api") {
    return (
      <PageShell>
        <PageHeader
          title="API Portal"
          description="For funds, analysts, and partners buying reputation data."
          status="Read-only Preview"
        />
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Key Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Generate, rotate, and revoke keys. Monitor usage and billing.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setView("landing")}>
                Back
              </Button>
              <Button onClick={signOut}>Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold tracking-tight">CERTLAYER</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{headline}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Protocols pay you to hold them accountable. Users are compensated automatically when SLA breaches are
              verified.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Protocols monitored</p>
                <p className="mt-1 text-2xl font-semibold">0</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Compensation executed</p>
                <p className="mt-1 text-2xl font-semibold">0 USDC</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Endpoints watched</p>
                <p className="mt-1 text-2xl font-semibold">0</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/explorer">View Public Reputation Explorer</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Access protocol dashboard or API portal.</CardDescription>
            {session ? (
              <p className="text-xs text-muted-foreground">
                Session active for <span className="font-mono">{session.wallet}</span>
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>
              <TabsContent value="wallet" className="mt-4 space-y-3">
                <Button className="w-full" onClick={signInWithMetaMask} disabled={loadingAuth || isConnecting}>
                  {loadingAuth || isConnecting
                    ? "Signing in..."
                    : isConnected
                      ? "Sign In with Connected Wallet"
                      : "Connect + Sign (MetaMask)"}
                </Button>
                <p className="text-xs text-muted-foreground">Sign a nonce message to authenticate. No transaction required.</p>
                {isConnected && address ? (
                  <p className="text-xs text-muted-foreground">
                    Connected wallet: <span className="font-mono">{address}</span>
                  </p>
                ) : null}
                {authError ? <p className="text-sm text-destructive">{authError}</p> : null}
              </TabsContent>
              <TabsContent value="email" className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="********" />
                </div>
                <Button>Sign In</Button>
              </TabsContent>
            </Tabs>

            <div className="h-px bg-border/70" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => openProtectedView("protocol")}>Open Protocol Dashboard</Button>
              <Button variant="outline" onClick={() => openProtectedView("api")}>
                Open API Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
