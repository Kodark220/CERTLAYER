"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";

type AuthMode = "signin" | "signup";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export default function SignInPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { connectAsync, isPending: isConnecting } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  async function postJson(path: string, body: Record<string, unknown>) {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (PUBLIC_API_KEY) headers["x-api-key"] = PUBLIC_API_KEY;
    return fetch(`${API_BASE_URL}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  }

  async function signInWithWallet() {
    setWalletLoading(true);
    setWalletError("");
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
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Wallet sign in failed");
    } finally {
      setWalletLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <div className="mx-auto max-w-md px-6 py-20">
        <h1 className="text-3xl font-semibold">Sign In</h1>
        <p className="mt-2 text-white/70">Sign in with wallet or email to access your CertLayer dashboard.</p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0F1623] p-6">
          <button
            onClick={signInWithWallet}
            disabled={walletLoading || isConnecting}
            className="h-11 w-full rounded-xl bg-[#2A76F6] text-sm font-semibold hover:bg-[#1f63d5] disabled:opacity-60"
          >
            {walletLoading || isConnecting ? "Signing In..." : "Connect Wallet"}
          </button>
          {walletError ? <p className="mt-3 text-sm text-red-300">{walletError}</p> : null}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0F1623]">
          <div className="grid grid-cols-2 border-b border-white/10">
            <button
              onClick={() => setMode("signin")}
              className={`h-12 text-sm font-semibold ${
                mode === "signin" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              Sign In with Email
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`h-12 text-sm font-semibold ${
                mode === "signup" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {mode === "signin" ? (
            <form className="grid gap-4 p-6">
              <div>
                <label className="text-sm text-white/70">Email</label>
                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-white/20"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="text-sm text-white/70">Password</label>
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-white/20"
                  placeholder="********"
                />
              </div>
              <button type="button" className="mt-2 h-11 rounded-xl bg-[#2A76F6] text-sm font-semibold hover:bg-[#1f63d5]">
                Sign In
              </button>
            </form>
          ) : (
            <form className="grid gap-4 p-6">
              <div>
                <label className="text-sm text-white/70">Email</label>
                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-white/20"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="text-sm text-white/70">Password</label>
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-white/20"
                  placeholder="Create password"
                />
              </div>
              <div>
                <label className="text-sm text-white/70">Confirm Password</label>
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-white/20"
                  placeholder="Confirm password"
                />
              </div>
              <button type="button" className="mt-2 h-11 rounded-xl bg-[#2A76F6] text-sm font-semibold hover:bg-[#1f63d5]">
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

