import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-semibold">Register Your Protocol</h1>
        <p className="mt-3 max-w-2xl text-white/70">
          Protocol onboarding is available in the dashboard flow. This page is a front-door placeholder for the public
          landing experience.
        </p>
        <div className="mt-8">
          <Link
            href="/signin"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#2A76F6] px-5 text-sm font-semibold hover:bg-[#1f63d5]"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}

