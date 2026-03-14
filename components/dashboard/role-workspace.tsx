import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

interface WorkspaceMetric {
  label: string;
  value: string;
  insight: string;
}

interface WorkspaceAction {
  title: string;
  description: string;
  href: string;
  tag: string;
  icon: LucideIcon;
}

interface RoleWorkspaceProps {
  badge: string;
  title: string;
  subtitle: string;
  theme: "teal" | "amber" | "blue" | "rose";
  metrics: WorkspaceMetric[];
  actions: WorkspaceAction[];
}

const themeMap: Record<RoleWorkspaceProps["theme"], string> = {
  teal: "from-teal-500/20 via-cyan-400/10 to-emerald-300/10",
  amber: "from-amber-500/25 via-orange-400/10 to-yellow-300/10",
  blue: "from-blue-500/20 via-sky-400/10 to-indigo-300/10",
  rose: "from-rose-500/20 via-red-400/10 to-orange-300/10",
};

export function RoleWorkspace({
  badge,
  title,
  subtitle,
  theme,
  metrics,
  actions,
}: RoleWorkspaceProps) {
  return (
    <section className="relative isolate mx-auto max-w-6xl overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />

      <div className={`rounded-3xl border border-white/50 bg-gradient-to-br ${themeMap[theme]} p-8 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.4)]`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-700">{badge}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-700 md:text-base">{subtitle}</p>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur transition-transform duration-300 hover:-translate-y-0.5"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-gray-500">{metric.label}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{metric.value}</p>
              <p className="mt-2 text-xs text-gray-600">{metric.insight}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gray-100 transition-transform duration-300 group-hover:scale-125" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-600">
                    {action.tag}
                  </span>
                  <Icon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-teal-700" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{action.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-700">
                  Open
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

