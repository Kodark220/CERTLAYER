export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <div className="mx-auto max-w-md px-6 py-20">
        <h1 className="text-3xl font-semibold">Sign in with Email</h1>
        <p className="mt-2 text-white/70">Use your email + password to access the dashboard.</p>

        <div className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-[#0F1623] p-6">
          <div>
            <label className="text-sm text-white/70">Email</label>
            <input
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
          <button className="mt-2 h-11 rounded-xl bg-[#2A76F6] text-sm font-semibold hover:bg-[#1f63d5]">
            Sign In
          </button>
        </div>
      </div>
    </main>
  );
}

