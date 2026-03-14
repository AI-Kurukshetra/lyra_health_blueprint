import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  HeartPulse,
  LifeBuoy,
  MessageSquareHeart,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundCog,
  Users,
} from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import type { AppRole } from "@/types/domain";

interface DashboardMetric {
  label: string;
  value: string;
  insight: string;
}

interface DashboardFeature {
  title: string;
  description: string;
  href: string;
  tag: string;
  icon: LucideIcon;
}

interface DashboardSection {
  title: string;
  hint: string;
  features: DashboardFeature[];
}

interface DashboardConfig {
  roleLabel: string;
  summary: string;
  metrics: DashboardMetric[];
  sections: DashboardSection[];
}

const dashboardByRole: Record<AppRole, DashboardConfig> = {
  employee: {
    roleLabel: "Employee",
    summary:
      "Access your full care journey from assessment to matching, appointments, messaging, and advanced support tools.",
    metrics: [
      {
        label: "Care Access",
        value: "Unified",
        insight: "All core and advanced tools are routed from this dashboard.",
      },
      {
        label: "Support Coverage",
        value: "24/7",
        insight: "Crisis triage and secure messaging are always available.",
      },
      {
        label: "Progress Pulse",
        value: "Live",
        insight: "Mood and intervention signals update continuously.",
      },
    ],
    sections: [
      {
        title: "Core Care",
        hint: "Must-have daily workflows",
        features: [
          {
            title: "Self-assessment",
            description: "Submit intake profile and risk context.",
            href: "/employee/assessment",
            tag: "Core",
            icon: ClipboardList,
          },
          {
            title: "Therapist matching",
            description:
              "Ranked providers with next-slot and random-slot booking.",
            href: "/employee/match",
            tag: "Core",
            icon: Sparkles,
          },
          {
            title: "Appointments",
            description: "Manage scheduled sessions and join session rooms.",
            href: "/employee/appointments",
            tag: "Core",
            icon: CalendarDays,
          },
          {
            title: "Mental health coaching",
            description: "Build coaching plans and book coaching sessions.",
            href: "/employee/coaching",
            tag: "Core",
            icon: LifeBuoy,
          },
          {
            title: "Progress tracking",
            description: "Log mood and monitor trend summaries.",
            href: "/employee/progress",
            tag: "Core",
            icon: HeartPulse,
          },
          {
            title: "Resource library",
            description: "Browse practical articles, worksheets, and videos.",
            href: "/employee/resources",
            tag: "Core",
            icon: BookOpen,
          },
          {
            title: "Secure messaging",
            description: "Message providers and escalate flagged concerns.",
            href: "/employee/messages",
            tag: "Core",
            icon: MessageSquareHeart,
          },
          {
            title: "Crisis support",
            description: "Run triage and follow critical escalation actions.",
            href: "/employee/crisis-support",
            tag: "Core",
            icon: Shield,
          },
        ],
      },
      {
        title: "Programs & Community",
        hint: "Engagement and support ecosystem",
        features: [
          {
            title: "Wellness challenges",
            description: "Track gamified wellness activity participation.",
            href: "/employee/wellness-challenges",
            tag: "Program",
            icon: Sparkles,
          },
          {
            title: "Group therapy",
            description: "Enroll into moderated group therapy sessions.",
            href: "/employee/group-therapy",
            tag: "Program",
            icon: Users,
          },
          {
            title: "Family support",
            description: "Access and track family-oriented support resources.",
            href: "/employee/family-support",
            tag: "Program",
            icon: ShieldCheck,
          },
          {
            title: "Peer support network",
            description: "Join and engage with moderated peer communities.",
            href: "/employee/peer-support",
            tag: "Program",
            icon: Users,
          },
          {
            title: "Automated reminders",
            description:
              "Configure reminders for care routines and follow-ups.",
            href: "/employee/reminders",
            tag: "Program",
            icon: CalendarClock,
          },
          {
            title: "Personalized care plans",
            description: "Track therapist-approved daily care actions.",
            href: "/employee/care-plans",
            tag: "Program",
            icon: ClipboardCheck,
          },
          {
            title: "Multi-language support",
            description: "Set language preferences for a localized experience.",
            href: "/employee/language-support",
            tag: "Program",
            icon: BookOpen,
          },
        ],
      },
      {
        title: "Advanced Features",
        hint: "Differentiating support capabilities",
        features: [
          {
            title: "AI chatbot triage",
            description: "24/7 conversational triage with urgency signals.",
            href: "/employee/chatbot-triage",
            tag: "Advanced",
            icon: Sparkles,
          },
          {
            title: "Micro-interventions",
            description: "Receive personalized short-form coping exercises.",
            href: "/employee/micro-interventions",
            tag: "Advanced",
            icon: HeartPulse,
          },
          {
            title: "Biometric integration",
            description: "Log wearable insights for stress and sleep patterns.",
            href: "/employee/biometric",
            tag: "Advanced",
            icon: Activity,
          },
          {
            title: "Digital therapeutics",
            description: "Track evidence-based therapeutic module completion.",
            href: "/employee/digital-therapeutics",
            tag: "Advanced",
            icon: ClipboardCheck,
          },
          {
            title: "VR therapy",
            description: "Plan immersive therapy environment sessions.",
            href: "/employee/vr-therapy",
            tag: "Advanced",
            icon: Stethoscope,
          },
          {
            title: "Mobile app access",
            description: "Manage mobile-first routines and quick actions.",
            href: "/employee/mobile-access",
            tag: "Advanced",
            icon: CalendarDays,
          },
        ],
      },
    ],
  },
  provider: {
    roleLabel: "Provider",
    summary:
      "Manage clinical workflow, communication, and advanced intervention programs from one role-aware command center.",
    metrics: [
      {
        label: "Caseload",
        value: "Live",
        insight: "Appointments and updates are synchronized in real time.",
      },
      {
        label: "Escalations",
        value: "Tracked",
        insight: "Crisis queue and sentiment signals are available.",
      },
      {
        label: "Network",
        value: "Managed",
        insight: "Provider network and care-plan controls are active.",
      },
    ],
    sections: [
      {
        title: "Clinical Operations",
        hint: "Daily provider workflow",
        features: [
          {
            title: "Availability",
            description: "Publish therapy and coaching slots for booking.",
            href: "/provider/availability",
            tag: "Core",
            icon: CalendarClock,
          },
          {
            title: "Appointments",
            description: "Update session lifecycle and save notes.",
            href: "/provider/appointments",
            tag: "Core",
            icon: ClipboardCheck,
          },
          {
            title: "Secure messaging",
            description: "Manage message threads and crisis escalations.",
            href: "/provider/messages",
            tag: "Core",
            icon: MessageSquareHeart,
          },
          {
            title: "Group therapy",
            description: "Operate and monitor group therapy cohorts.",
            href: "/provider/group-therapy",
            tag: "Core",
            icon: Users,
          },
          {
            title: "Personalized care plans",
            description: "Create and track care actions by patient needs.",
            href: "/provider/care-plans",
            tag: "Core",
            icon: ClipboardList,
          },
        ],
      },
      {
        title: "Network & Programs",
        hint: "Care delivery expansion",
        features: [
          {
            title: "Provider network management",
            description: "Track specialty coverage and panel readiness.",
            href: "/provider/network-management",
            tag: "Program",
            icon: Users,
          },
          {
            title: "Automated reminders",
            description: "Configure care reminders and follow-up nudges.",
            href: "/provider/reminders",
            tag: "Program",
            icon: CalendarDays,
          },
          {
            title: "Cultural matching",
            description:
              "Improve cultural alignment in provider recommendations.",
            href: "/provider/cultural-matching",
            tag: "Program",
            icon: Sparkles,
          },
          {
            title: "Digital therapeutics",
            description: "Assign and track digital therapeutic modules.",
            href: "/provider/digital-therapeutics",
            tag: "Program",
            icon: ClipboardCheck,
          },
          {
            title: "Biometric integration",
            description:
              "Interpret wearable trend signals for treatment support.",
            href: "/provider/biometric",
            tag: "Program",
            icon: Activity,
          },
          {
            title: "VR therapy",
            description: "Plan immersive treatment sessions and outcomes.",
            href: "/provider/vr-therapy",
            tag: "Program",
            icon: Stethoscope,
          },
        ],
      },
      {
        title: "AI Monitoring",
        hint: "Predictive and sentiment intelligence",
        features: [
          {
            title: "Early warning system",
            description: "Detect high-risk signals before crisis escalation.",
            href: "/provider/early-warning",
            tag: "Advanced",
            icon: Shield,
          },
          {
            title: "Sentiment insights",
            description: "Observe communication sentiment and watch status.",
            href: "/provider/sentiment-insights",
            tag: "Advanced",
            icon: BarChart3,
          },
        ],
      },
    ],
  },
  employer_admin: {
    roleLabel: "Employer Admin",
    summary:
      "Review anonymized workplace wellness outcomes, forecast demand, and run compliance-ready operations.",
    metrics: [
      {
        label: "Privacy",
        value: "Anonymized",
        insight: "No individual PHI is surfaced in employer views.",
      },
      {
        label: "Forecasting",
        value: "Active",
        insight: "Demand and capacity trends are continuously computed.",
      },
      {
        label: "Governance",
        value: "Audit Ready",
        insight: "Compliance exports and operations controls are available.",
      },
    ],
    sections: [
      {
        title: "Analytics",
        hint: "Organization-level insight suite",
        features: [
          {
            title: "Employer analytics",
            description:
              "Utilization and access trends for workforce wellbeing.",
            href: "/employer/analytics",
            tag: "Core",
            icon: BarChart3,
          },
          {
            title: "Workplace stress",
            description: "Track stress index and risk signal movement.",
            href: "/employer/workplace-stress",
            tag: "Advanced",
            icon: Activity,
          },
          {
            title: "Team insights",
            description: "Anonymous team engagement and completion indicators.",
            href: "/employer/team-insights",
            tag: "Advanced",
            icon: Users,
          },
          {
            title: "Utilization forecast",
            description: "Predict demand and provider capacity gaps.",
            href: "/employer/utilization-forecast",
            tag: "Advanced",
            icon: CalendarClock,
          },
          {
            title: "ROI calculator",
            description: "Estimate business return from care participation.",
            href: "/employer/roi-calculator",
            tag: "Advanced",
            icon: Sparkles,
          },
          {
            title: "Sentiment insights",
            description: "Observe anonymized messaging sentiment trends.",
            href: "/employer/sentiment-insights",
            tag: "Advanced",
            icon: HeartPulse,
          },
        ],
      },
      {
        title: "Operations & Governance",
        hint: "Program administration controls",
        features: [
          {
            title: "Compliance reporting",
            description: "Export audit CSV for governance and reviews.",
            href: "/employer/compliance",
            tag: "Core",
            icon: ShieldCheck,
          },
          {
            title: "Secure messaging",
            description: "Coordinate support with providers, employees, and admins.",
            href: "/employer/messages",
            tag: "Core",
            icon: MessageSquareHeart,
          },
          {
            title: "Provider network",
            description: "Track provider coverage and specialty gaps.",
            href: "/employer/provider-network",
            tag: "Core",
            icon: Users,
          },
          {
            title: "Manager training",
            description: "Run manager mental health training programs.",
            href: "/employer/manager-training",
            tag: "Program",
            icon: ClipboardCheck,
          },
          {
            title: "Insurance integration",
            description: "Manage payer integration and coverage alignment.",
            href: "/employer/insurance-integration",
            tag: "Program",
            icon: Shield,
          },
          {
            title: "Automated reminders",
            description: "Coordinate reminder campaigns across teams.",
            href: "/employer/reminders",
            tag: "Program",
            icon: CalendarDays,
          },
        ],
      },
    ],
  },
  system_admin: {
    roleLabel: "System Admin",
    summary:
      "Operate platform governance, integrations, and advanced intelligence across all roles and tenant workflows.",
    metrics: [
      {
        label: "Security Posture",
        value: "Hardened",
        insight: "Auth and RLS boundaries are enforced.",
      },
      {
        label: "Tenant Controls",
        value: "Enforced",
        insight: "Role-scoped data access is policy-protected.",
      },
      {
        label: "Operations",
        value: "Monitored",
        insight: "Insights and audits can be reviewed centrally.",
      },
    ],
    sections: [
      {
        title: "Platform Governance",
        hint: "Admin control plane",
        features: [
          {
            title: "Integration APIs",
            description: "Track enterprise HRIS and API connectivity status.",
            href: "/admin/integration-apis",
            tag: "Admin",
            icon: Shield,
          },
          {
            title: "Secure messaging",
            description: "Review and coordinate cross-role secure conversations.",
            href: "/admin/messages",
            tag: "Admin",
            icon: MessageSquareHeart,
          },
          {
            title: "Provider network",
            description: "Oversee network quality and specialization coverage.",
            href: "/admin/provider-network",
            tag: "Admin",
            icon: Users,
          },
          {
            title: "Manager training",
            description: "Monitor manager readiness programs across orgs.",
            href: "/admin/manager-training",
            tag: "Admin",
            icon: ClipboardCheck,
          },
          {
            title: "Insurance integration",
            description: "Watch payer integration health and incidents.",
            href: "/admin/insurance-integration",
            tag: "Admin",
            icon: ShieldCheck,
          },
        ],
      },
      {
        title: "Global Intelligence",
        hint: "Advanced insight monitoring",
        features: [
          {
            title: "Early warning",
            description: "Platform-wide proactive deterioration signals.",
            href: "/admin/early-warning",
            tag: "Advanced",
            icon: Activity,
          },
          {
            title: "Workplace stress",
            description: "Cross-org workplace stress trend indicators.",
            href: "/admin/workplace-stress",
            tag: "Advanced",
            icon: HeartPulse,
          },
          {
            title: "Team insights",
            description: "Anonymous team-level engagement signals.",
            href: "/admin/team-insights",
            tag: "Advanced",
            icon: Users,
          },
          {
            title: "Utilization forecast",
            description: "Demand and capacity projection monitoring.",
            href: "/admin/utilization-forecast",
            tag: "Advanced",
            icon: CalendarClock,
          },
          {
            title: "ROI signals",
            description: "Estimated productivity return tracking.",
            href: "/admin/roi-calculator",
            tag: "Advanced",
            icon: BarChart3,
          },
          {
            title: "Sentiment analysis",
            description: "Live sentiment risk trend visibility.",
            href: "/admin/sentiment-insights",
            tag: "Advanced",
            icon: Sparkles,
          },
        ],
      },
      {
        title: "Cross-Role Views",
        hint: "Operational shortcuts",
        features: [
          {
            title: "Employer analytics",
            description: "Inspect employer-level anonymized dashboards.",
            href: "/employer/analytics",
            tag: "Ops",
            icon: BarChart3,
          },
          {
            title: "Compliance exports",
            description: "Run compliance reporting and audit exports.",
            href: "/employer/compliance",
            tag: "Ops",
            icon: ShieldCheck,
          },
          {
            title: "Provider scheduling",
            description: "Open provider calendar operations directly.",
            href: "/provider/availability",
            tag: "Ops",
            icon: CalendarDays,
          },
        ],
      },
    ],
  },
};

const roleIcons: Record<AppRole, typeof ClipboardCheck> = {
  employee: ClipboardCheck,
  provider: Stethoscope,
  employer_admin: BarChart3,
  system_admin: UserRoundCog,
};

const sectionThemes = [
  {
    panel: "from-teal-50/80 via-white to-cyan-50/70",
    badge: "border-teal-200 bg-teal-50 text-teal-700",
    glow: "bg-teal-100",
  },
  {
    panel: "from-amber-50/80 via-white to-orange-50/70",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    glow: "bg-amber-100",
  },
  {
    panel: "from-blue-50/80 via-white to-indigo-50/70",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    glow: "bg-blue-100",
  },
];

function tagClass(tag: string): string {
  if (tag === "Core") return "border-teal-200 bg-teal-50 text-teal-700";
  if (tag === "Program") return "border-amber-200 bg-amber-50 text-amber-700";
  if (tag === "Advanced") return "border-blue-200 bg-blue-50 text-blue-700";
  if (tag === "Admin") return "border-violet-200 bg-violet-50 text-violet-700";
  if (tag === "Ops") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-gray-200 bg-gray-50 text-gray-700";
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const role = session.profile?.role ?? "employee";
  const config = dashboardByRole[role];
  const Icon = roleIcons[role];

  return (
    <section className="relative isolate mx-auto max-w-6xl overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute -left-16 top-8 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-10 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-28 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" />

      <div className="rounded-3xl border border-teal-100/80 bg-gradient-to-br from-white via-white to-teal-50/70 p-8 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.5)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              {config.roleLabel} Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
              Welcome, {config.roleLabel}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-600">
              {config.summary}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-3 text-teal-700">
            <Icon className="h-5 w-5" />
            <span className="text-sm font-semibold">
              {config.roleLabel} Access
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {config.metrics.map((metric, metricIndex) => (
            <article
              key={metric.label}
              className={`rounded-2xl border p-4 shadow-sm ${
                metricIndex % 3 === 0
                  ? "border-teal-100 bg-gradient-to-br from-teal-50/80 via-white to-white"
                  : metricIndex % 3 === 1
                    ? "border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-white"
                    : "border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-white"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {metric.value}
              </p>
              <p className="mt-2 text-sm text-gray-600">{metric.insight}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {config.sections.map((section, sectionIndex) => {
          const theme = sectionThemes[sectionIndex % sectionThemes.length];
          return (
            <section
              key={section.title}
              className={`rounded-3xl border border-white/70 bg-gradient-to-br ${theme.panel} p-5 shadow-lg`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {section.title}
                </h2>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${theme.badge}`}
                >
                  {section.hint}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {section.features.map((feature) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <Link
                      key={feature.href}
                      href={feature.href}
                      className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div
                        className={`absolute -right-8 -top-8 h-20 w-20 rounded-full ${theme.glow} transition-transform duration-300 group-hover:scale-125`}
                      />
                      <div className="relative">
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${tagClass(feature.tag)}`}
                          >
                            {feature.tag}
                          </span>
                          <FeatureIcon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-teal-700" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                          {feature.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {feature.description}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-700">
                          Open feature
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
