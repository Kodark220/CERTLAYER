"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { address, isConnected } = useAccount();
  const { connectAsync, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function onConnectWallet() {
    try {
      await connectAsync({ connector: injected() });
      setOpen(false);
    } catch {
      // user cancelled / no wallet
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1220]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
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
                    disabled={connecting}
                    className="w-full rounded-lg bg-[#2A76F6] px-3 py-2 text-sm font-semibold hover:bg-[#1f63d5] disabled:opacity-60"
                  >
                    {connecting ? "Connecting..." : "Connect Wallet"}
                  </button>
                )}

                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                >
                  Sign in with Email
                </Link>
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
