"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export default function SignInPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { connectAsync, isPending: isConnecting } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function postJson(path: string, body: Record<string, unknown>) {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (PUBLIC_API_KEY) headers["x-api-key"] = PUBLIC_API_KEY;
    return fetch(`${API_BASE_URL}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  }

  async function signInWithWallet() {
    setLoading(true);
    setError("");
    try {
      let wallet = address as string | undefined;
      if (!wallet) {
        const connected = await connectAsync({ connector: injected() });
        wallet = connected.accounts?.[0];
      }
      if (!wallet) throw new Error("No wallet selected");

      const nonceRes = await postJson("/v1/auth/wallet/nonce", { wallet });
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData.error || "Failed to request nonce");

      const signature = await signMessageAsync({ message: nonceData.message });

      const verifyRes = await postJson("/v1/auth/wallet/verify", { wallet, signature });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Wallet verification failed");

      localStorage.setItem("certlayer_session_token", verifyData.token);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <div className="mx-auto max-w-md px-6 py-20">
        <h1 className="text-3xl font-semibold">Sign in to Dashboard</h1>
        <p className="mt-2 text-white/70">Use wallet authentication to access protocol registration and operations.</p>

        <div className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-[#0F1623] p-6">
          <button
            onClick={signInWithWallet}
            disabled={loading || isConnecting}
            className="h-11 rounded-xl bg-[#2A76F6] text-sm font-semibold hover:bg-[#1f63d5] disabled:opacity-60"
          >
            {loading || isConnecting ? "Signing In..." : "Connect Wallet + Sign"}
          </button>

          <p className="text-xs text-white/60">No transaction is sent. You are only signing a nonce challenge.</p>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
      </div>
    </main>
  );
}

