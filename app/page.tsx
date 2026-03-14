import { Activity, CalendarClock, MessageSquareHeart, ShieldCheck, Sparkles, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";

const highlights = [
  {
    title: "Therapist Matching",
    description: "Role-aware matching with availability-first ranking and smart booking.",
    icon: Sparkles,
    accent: "from-teal-500/20 to-cyan-500/20",
  },
  {
    title: "Secure Messaging",
    description: "Encrypted, real-time communication across employee, provider, and admin roles.",
    icon: MessageSquareHeart,
    accent: "from-rose-500/20 to-orange-500/20",
  },
  {
    title: "Smart Reminders",
    description: "Appointment, medication, and wellness nudges with in-app alerting.",
    icon: CalendarClock,
    accent: "from-indigo-500/20 to-blue-500/20",
  },
];

export default async function Home() {
  const session = await getAuthSession();
  if (session?.profile?.role) {
    redirect("/dashboard");
  }

  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute -left-28 top-8 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-16 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 left-1/3 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-8 rounded-3xl border border-white/60 bg-white/85 p-8 shadow-[0_35px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Enterprise Mental Wellness Platform
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-gray-900">
              Connected care journeys for employees, providers, and workplace leaders.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
              Lyra Health Platform unifies therapist matching, session operations, secure messaging,
              reminders, and anonymized analytics with role-based access and audit-ready workflows.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-gray-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Availability</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">24/7</p>
              </article>
              <article className="rounded-2xl border border-gray-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Role Controls</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">4-Tier</p>
              </article>
              <article className="rounded-2xl border border-gray-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Data Access</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">RLS Secured</p>
              </article>
            </div>
          </div>

          <div className="relative rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-200/50 blur-2xl" />
            <div className="space-y-3">
              <article className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
                  <Activity className="h-3.5 w-3.5" />
                  Live Operations
                </p>
                <p className="mt-2 text-sm text-gray-700">Appointment status, reminders, and alerts are synchronized in real time.</p>
              </article>
              <article className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
                  <Users className="h-3.5 w-3.5" />
                  Care Network
                </p>
                <p className="mt-2 text-sm text-gray-700">Employees, providers, admins, and system operators collaborate in one platform.</p>
              </article>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {highlights.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    <Icon className="h-4 w-4 text-teal-700" />
                    Platform Capability
                  </p>
                  <h2 className="mt-3 text-lg font-semibold text-gray-900">{feature.title}</h2>
                  <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
