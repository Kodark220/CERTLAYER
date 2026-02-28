"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { injected } from "wagmi/connectors";
import { useDisconnect } from "wagmi";
import { useAccount, useConnect, useSignMessage } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type CommitmentPreview = {
  protocolId: string;
  commitmentId: string;
  commitmentType: string;
  amount?: number;
  asset?: string;
  status: string;
  result: string;
  deadlineTs: number;
  updatedAt: string;
};

type ProtocolPreview = {
  id: string;
  name: string;
  website: string;
  protocolType: string;
  uptimeBps: number;
  coveragePoolUsdc?: number;
  createdAt?: string;
};

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
  amount: "",
  asset: "USDC",
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

async function getJson(path: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (PUBLIC_API_KEY) headers["x-api-key"] = PUBLIC_API_KEY;
  return fetch(`${API_BASE_URL}${path}`, { method: "GET", headers });
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
  const [activeProtocol, setActiveProtocol] = useState<ProtocolPreview | null>(null);
  const [protocolOptions, setProtocolOptions] = useState<ProtocolPreview[]>([]);
  const [commitmentItems, setCommitmentItems] = useState<CommitmentPreview[]>([]);
  const [commitmentsLoading, setCommitmentsLoading] = useState(false);
  const [commitmentsError, setCommitmentsError] = useState("");
  const [poolDepositAmount, setPoolDepositAmount] = useState("");
  const [poolDepositLoading, setPoolDepositLoading] = useState(false);
  const [poolDepositError, setPoolDepositError] = useState("");
  const [poolDepositSuccess, setPoolDepositSuccess] = useState("");

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
  const hasRegisteredProtocol = useMemo(() => Boolean(activeProtocolId), [activeProtocolId]);
  const commitmentCount = commitmentItems.length;
  const registeredUptimePct = useMemo(() => {
    if (!activeProtocol) return 99.84;
    const parsed = Number(activeProtocol.uptimeBps);
    if (!Number.isFinite(parsed) || parsed <= 0) return 99.84;
    return Math.min(100, Math.max(95, parsed / 100));
  }, [activeProtocol]);
  const reputationSummary = useMemo(() => {
    if (!hasRegisteredProtocol || commitmentCount === 0) {
      return { value: "100 (AAA)", meta: "New protocol baseline" };
    }

    const hasMissed = commitmentItems.some((item) => item.result === "missed");
    const hasPartial = commitmentItems.some((item) => item.result === "partial");
    const score = hasMissed ? 85 : hasPartial ? 92 : 98;
    const grade = score >= 90 ? "AAA" : score >= 80 ? "AA" : "A";
    return {
      value: `${score} (${grade})`,
      meta: `Based on ${commitmentCount} commitment${commitmentCount === 1 ? "" : "s"}`,
    };
  }, [hasRegisteredProtocol, commitmentCount, commitmentItems]);
  const coverageSummary = useMemo(() => {
    const value = Number(activeProtocol?.coveragePoolUsdc || 0);
    if (value <= 0) return { value: "Empty", meta: "No funds yet" };
    return { value: `${value.toLocaleString()} USDC`, meta: "Funded pool" };
  }, [activeProtocol]);
  const compensationSummary = useMemo(
    () => ({
      value: "0 USDC",
      meta: commitmentCount > 0 ? `${commitmentCount} commitment${commitmentCount === 1 ? "" : "s"} tracked` : "No commitments yet",
    }),
    [commitmentCount]
  );

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

  useEffect(() => {
    async function loadProtocolsForSession() {
      if (!session || activeProtocolId) return;
      try {
        const res = await getJson("/v1/protocols", session.token);
        const data = await res.json();
        if (!res.ok) return;
        if (Array.isArray(data.items) && data.items.length > 0) {
          const mapped = data.items.map((item: any) => ({
            id: item.id || "",
            name: item.name || "",
            website: item.website || "",
            protocolType: item.protocolType || "",
            uptimeBps: Number(item.uptimeBps || 0),
            coveragePoolUsdc: Number(item.coveragePoolUsdc || 0),
            createdAt: item.createdAt || "",
          }));
          setProtocolOptions(mapped);
          const first = data.items[0];
          setActiveProtocolId(first.id || "");
          setActiveProtocol({
            id: first.id || "",
            name: first.name || "",
            website: first.website || "",
            protocolType: first.protocolType || "",
            uptimeBps: Number(first.uptimeBps || 0),
            coveragePoolUsdc: Number(first.coveragePoolUsdc || 0),
            createdAt: first.createdAt || "",
          });
        }
      } catch {
        // non-blocking
      }
    }
    void loadProtocolsForSession();
  }, [session, activeProtocolId]);

  useEffect(() => {
    async function loadCommitments() {
      if (!session || !activeProtocolId) {
        setCommitmentItems([]);
        return;
      }
      setCommitmentsLoading(true);
      setCommitmentsError("");
      try {
        const res = await getJson(`/v1/commitments?protocolId=${encodeURIComponent(activeProtocolId)}`, session.token);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load commitments");
        setCommitmentItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        setCommitmentsError(e instanceof Error ? e.message : "Failed to load commitments");
      } finally {
        setCommitmentsLoading(false);
      }
    }
    void loadCommitments();
  }, [session, activeProtocolId]);

  useEffect(() => {
    if (!session || !activeProtocolId) return;
    const timer = setInterval(async () => {
      try {
        const res = await getJson(`/v1/commitments?protocolId=${encodeURIComponent(activeProtocolId)}`, session.token);
        const data = await res.json();
        if (res.ok) {
          setCommitmentItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        // polling is best-effort
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [session, activeProtocolId]);

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
      const createdProtocol = {
        id: data.protocol.id,
        name: data.protocol.name || "",
        website: data.protocol.website || "",
        protocolType: data.protocol.protocolType || "",
        uptimeBps: Number(data.protocol.uptimeBps || 0),
        coveragePoolUsdc: Number(data.protocol.coveragePoolUsdc || 0),
        createdAt: data.protocol.createdAt || new Date().toISOString(),
      };
      setActiveProtocol(createdProtocol);
      setProtocolOptions((prev) => {
        const exists = prev.some((p) => p.id === createdProtocol.id);
        if (exists) {
          return prev.map((p) => (p.id === createdProtocol.id ? createdProtocol : p));
        }
        return [createdProtocol, ...prev];
      });
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
      const refreshRes = await getJson(`/v1/commitments?protocolId=${encodeURIComponent(protocolId)}`, session.token);
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) {
        setCommitmentItems(Array.isArray(refreshData.items) ? refreshData.items : []);
      }
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

  async function submitPoolDeposit() {
    if (!session) return setPoolDepositError("Please sign in first.");
    if (!activeProtocolId) return setPoolDepositError("Register/select a protocol first.");
    const amount = Number(poolDepositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return setPoolDepositError("Enter a valid amount greater than 0.");
    }

    setPoolDepositError("");
    setPoolDepositSuccess("");
    setPoolDepositLoading(true);
    try {
      const res = await postJson("/v1/pools/deposit", { protocolId: activeProtocolId, amount }, session.token);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pool deposit failed");
      const updatedPool = Number(data.protocol?.coveragePoolUsdc || 0);
      setActiveProtocol((prev) => {
        if (!prev) return prev;
        return { ...prev, coveragePoolUsdc: updatedPool };
      });
      setProtocolOptions((prev) =>
        prev.map((protocol) =>
          protocol.id === activeProtocolId ? { ...protocol, coveragePoolUsdc: updatedPool } : protocol
        )
      );
      setPoolDepositSuccess(`Pool funded: ${amount} USDC`);
      setPoolDepositAmount("");
    } catch (e) {
      setPoolDepositError(e instanceof Error ? e.message : "Pool deposit failed");
    } finally {
      setPoolDepositLoading(false);
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
        description={
          hasRegisteredProtocol
            ? "Private operational view for protocol teams."
            : "Complete onboarding to unlock protocol metrics."
        }
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

      {hasRegisteredProtocol ? (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <MetricCard label="Reputation Score" value={reputationSummary.value} meta={reputationSummary.meta} />
            <MetricCard label="Coverage Pool" value={coverageSummary.value} meta={coverageSummary.meta} />
            <MetricCard label="30d Uptime" value={`${registeredUptimePct.toFixed(2)}% ↑`} meta="From registered protocol target" />
            <MetricCard label="Compensation Paid" value={compensationSummary.value} meta={compensationSummary.meta} />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Uptime Trend (90d)</CardTitle>
              <CardDescription>Reliability trend preview for internal operations.</CardDescription>
            </CardHeader>
            <CardContent>
              <UptimeChart previewUptime={registeredUptimePct} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Onboarding In Progress</CardTitle>
            <CardDescription>Register your protocol below. Metrics and trend cards appear immediately after successful registration.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="my-1 h-px bg-border/70" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "protocol" | "incidents" | "commitments" | "security")} className="w-full">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="protocol">Register Protocol</TabsTrigger>
          {canSeeInternalControls ? <TabsTrigger value="incidents">Incident Lifecycle</TabsTrigger> : null}
          {canSeeInternalControls ? <TabsTrigger value="commitments">Commitments</TabsTrigger> : null}
          {canSeeInternalControls ? <TabsTrigger value="security">Security Response</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="protocol" className="mt-4">
          <div className="space-y-4">
            {!canSeeInternalControls && hasRegisteredProtocol ? (
              <Card className="border-border/70 bg-card shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>Protocol Registered</CardTitle>
                    <Badge className="bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/20">Active</Badge>
                  </div>
                  <CardDescription>Your onboarding is complete. Commitment actions are managed by admins.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <p className="text-sm text-muted-foreground">
                    Protocol: <span className="font-semibold text-foreground">{activeProtocol?.name || activeProtocolId}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: <span className="font-mono">{activeProtocolId}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Protocol Type: <span className="font-semibold text-foreground">{(activeProtocol?.protocolType || "unknown").toUpperCase()}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Commitments: <span className="font-semibold text-foreground">{commitmentCount} added</span>
                  </p>
                  <p className="text-sm text-muted-foreground md:col-span-2">
                    Registered At:{" "}
                    <span className="font-semibold text-foreground">
                      {activeProtocol?.createdAt ? new Date(activeProtocol.createdAt).toLocaleString() : "N/A"}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ) : (
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
            )}

            {hasRegisteredProtocol ? (
              <Card className="border-border/70 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Compensation Pool</CardTitle>
                  <CardDescription>Fund the pool used for compensation payouts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Deposit Amount (USDC)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="1000"
                        value={poolDepositAmount}
                        onChange={(e) => setPoolDepositAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={submitPoolDeposit} disabled={poolDepositLoading}>
                    {poolDepositLoading ? "Depositing..." : "Add to Compensation Pool"}
                  </Button>
                  {poolDepositSuccess ? <p className="text-sm text-emerald-400">{poolDepositSuccess}</p> : null}
                  {poolDepositError ? <p className="text-sm text-destructive">{poolDepositError}</p> : null}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-border/70 bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Protocol Commitments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!activeProtocolId ? <p className="text-sm text-muted-foreground">No active protocol selected yet.</p> : null}
                {activeProtocolId ? (
                  <p className="text-xs text-muted-foreground">
                    Active Protocol ID: <span className="font-mono">{activeProtocolId}</span>
                  </p>
                ) : null}
                {commitmentsLoading ? <p className="text-sm text-muted-foreground">Loading commitments...</p> : null}
                {commitmentsError ? <p className="text-sm text-destructive">{commitmentsError}</p> : null}
                {!commitmentsLoading && !commitmentsError && activeProtocolId && commitmentItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No commitments added yet.</p>
                ) : null}
                {!commitmentsLoading && !commitmentsError && commitmentItems.length > 0 ? (
                  <div className="space-y-2">
                    {commitmentItems.map((item) => (
                      <div key={`${item.protocolId}-${item.commitmentId}`} className="rounded-md border border-border/70 bg-muted/20 p-3">
                        <p className="text-sm">
                          <span className="font-mono">{item.commitmentId}</span> • {item.commitmentType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {item.status}
                          {item.result ? ` • Result: ${item.result}` : ""}
                          {Number.isFinite(item.amount) ? ` • Amount: ${item.amount} ${item.asset || ""}` : ""}
                          {item.deadlineTs ? ` • Deadline: ${item.deadlineTs}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
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
            <div className="space-y-4">
              <Card className="border-border/70 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Target Protocol</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Select
                    value={activeProtocolId}
                    onValueChange={(value) => {
                      setActiveProtocolId(value);
                      const selected = protocolOptions.find((p) => p.id === value) || null;
                      setActiveProtocol(selected);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      {protocolOptions.map((protocol) => (
                        <SelectItem key={protocol.id} value={protocol.id}>
                          {protocol.name || protocol.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeProtocolId ? (
                    <p className="text-xs text-muted-foreground">
                      Selected protocol ID: <span className="font-mono">{activeProtocolId}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No protocol selected yet.</p>
                  )}
                </CardContent>
              </Card>

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
                      amount: commitmentForm.amount ? Number(commitmentForm.amount) : 0,
                      asset: commitmentForm.asset || "USDC",
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
            </div>
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
