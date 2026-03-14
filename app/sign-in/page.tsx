import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, LockKeyhole, Sparkles, Stethoscope } from "lucide-react";
import { signInAction } from "@/app/actions/auth";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { getAuthSession } from "@/lib/auth/session";

interface SignInPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getAuthSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const redirectToParam = params.redirectTo;
  const errorParam = typeof params.error === "string" ? params.error : null;
  const createdParam = typeof params.created === "string" ? params.created : null;
  const redirectTo =
    typeof redirectToParam === "string" && redirectToParam.startsWith("/")
      ? redirectToParam
      : "/dashboard";

  return (
    <section className="relative isolate mx-auto min-h-[calc(100vh-70px)] max-w-6xl overflow-hidden px-6 py-8">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="grid items-stretch gap-6 md:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-white/60 bg-white/85 p-7 shadow-xl backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-gray-600">
            <LockKeyhole className="h-3.5 w-3.5" />
            Secure Access
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm leading-7 text-gray-600">
            Sign in to continue your care workflows across employee, provider, and employer experiences.
          </p>

          {createdParam === "1" && (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Account created successfully. Sign in to continue.
            </p>
          )}
          {errorParam && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {errorParam}
            </p>
          )}

          <form action={signInAction} className="mt-6 space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Work Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                placeholder="name@company.com"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                placeholder="Enter your password"
              />
            </label>
            <AuthSubmitButton label="Sign in" pendingLabel="Signing in..." />
          </form>

          <p className="mt-4 text-sm text-gray-600">
            New user?{" "}
            <Link href="/sign-up" className="font-semibold text-teal-700 hover:text-teal-800">
              Create an account
            </Link>
          </p>
        </div>

        <aside className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-600 to-cyan-600 p-7 text-white shadow-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]">
            <Sparkles className="h-3.5 w-3.5" />
            Platform Highlights
          </p>
          <h2 className="mt-4 text-2xl font-semibold leading-tight">Care infrastructure built for real enterprise use.</h2>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-white/90">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
              Role-aware experience for employees, providers, and admins.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
              Supabase-backed tenant isolation with audit-ready operations.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
              Session scheduling, messaging, and crisis workflows in one system.
            </li>
          </ul>
          <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-white/75">Clinical Ready</p>
            <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium">
              <Stethoscope className="h-4 w-4" />
              End-to-end care journey activation
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
