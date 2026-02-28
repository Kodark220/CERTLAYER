"use client";

import { useState } from "react";

type AuthMode = "signin" | "signup";

export default function SignInPage() {
  const [mode, setMode] = useState<AuthMode>("signin");

  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <div className="mx-auto max-w-md px-6 py-20">
        <h1 className="text-3xl font-semibold">Sign in with Email</h1>
        <p className="mt-2 text-white/70">Access your CertLayer dashboard with email and password.</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0F1623]">
          <div className="grid grid-cols-2 border-b border-white/10">
            <button
              onClick={() => setMode("signin")}
              className={`h-12 text-sm font-semibold ${
                mode === "signin" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              Sign In
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

