import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, HeartHandshake, ShieldCheck, UserRoundPlus } from "lucide-react";
import { signUpAction } from "@/app/actions/auth";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { getAuthSession } from "@/lib/auth/session";

interface SignUpPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const session = await getAuthSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorParam = typeof params.error === "string" ? params.error : null;

  return (
    <section className="relative isolate mx-auto min-h-[calc(100vh-70px)] max-w-6xl overflow-hidden px-6 py-8">
      <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="grid items-stretch gap-6 md:grid-cols-[0.95fr_1fr]">
        <aside className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-500 to-orange-500 p-7 text-white shadow-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]">
            <HeartHandshake className="h-3.5 w-3.5" />
            Join Care Network
          </p>
          <h2 className="mt-4 text-2xl font-semibold leading-tight">Start with employee access and grow your care journey.</h2>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-white/90">
            <li className="flex items-start gap-2">
              <BadgeCheck className="mt-1 h-4 w-4 shrink-0" />
              Sign-up is frictionless with secure Supabase authentication.
            </li>
            <li className="flex items-start gap-2">
              <BadgeCheck className="mt-1 h-4 w-4 shrink-0" />
              Profiles are provisioned automatically and linked to organization scope.
            </li>
            <li className="flex items-start gap-2">
              <BadgeCheck className="mt-1 h-4 w-4 shrink-0" />
              Role upgrades to provider and employer admin are governed later.
            </li>
          </ul>
          <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" />
              Privacy-preserving by design
            </p>
          </div>
        </aside>

        <div className="rounded-3xl border border-white/60 bg-white/85 p-7 shadow-xl backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-gray-600">
            <UserRoundPlus className="h-3.5 w-3.5" />
            Create Account
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">Set up your profile</h1>
          <p className="mt-2 text-sm leading-7 text-gray-600">
            Your account starts as employee access. Admin workflows can later assign provider or employer roles.
          </p>
          {errorParam && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {errorParam}
            </p>
          )}
          <form action={signUpAction} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Full name</span>
              <input
                name="fullName"
                type="text"
                autoComplete="name"
                minLength={2}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                placeholder="Enter your full name"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                placeholder="name@company.com"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Password</span>
              <input
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                placeholder="Minimum 8 characters"
              />
            </label>
            <AuthSubmitButton label="Create account" pendingLabel="Creating..." />
          </form>
          <p className="mt-4 text-sm text-gray-600">
            Already registered?{" "}
            <Link href="/sign-in" className="font-semibold text-teal-700 hover:text-teal-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
