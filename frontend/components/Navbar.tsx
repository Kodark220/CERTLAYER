"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { address, isConnected } = useAccount();
  const { connectAsync, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function postJson(path: string, body: Record<string, unknown>) {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (PUBLIC_API_KEY) headers["x-api-key"] = PUBLIC_API_KEY;
    return fetch(`${API_BASE_URL}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  }

  async function onConnectWallet() {
    setAuthError("");
    setAuthLoading(true);
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
      setOpen(false);
      router.push("/dashboard");
    } catch {
      setAuthError("Wallet sign in failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1220]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-semibold tracking-tight md:text-3xl">
          CertLayer
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
          <a href="#how" className="hover:text-white">
            How it works
          </a>
          <a href="#explorer" className="hover:text-white">
            Explorer
          </a>
          <a href="#docs" className="hover:text-white">
            Docs
          </a>

          <div className="relative" ref={ref}>
            <button
              className="rounded-lg px-3 py-2 hover:bg-white/5 hover:text-white"
              onClick={() => setOpen((v) => !v)}
            >
              Sign In
            </button>

            {open ? (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-white/10 bg-[#0F1623] p-3 shadow-xl">
                {isConnected ? (
                  <>
                    <div className="mb-2 px-2 text-xs text-white/60">
                      Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        setOpen(false);
                      }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onConnectWallet}
                    disabled={connecting || authLoading}
                    className="w-full rounded-lg bg-[#2A76F6] px-3 py-2 text-sm font-semibold hover:bg-[#1f63d5] disabled:opacity-60"
                  >
                    {connecting || authLoading ? "Signing In..." : "Connect Wallet"}
                  </button>
                )}

                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                >
                  Sign in with Email
                </Link>
                {authError ? <p className="mt-2 px-2 text-xs text-red-300">{authError}</p> : null}
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
