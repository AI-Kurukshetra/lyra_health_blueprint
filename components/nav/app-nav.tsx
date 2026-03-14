import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LanguageSwitcher } from "@/components/nav/language-switcher";
import { NavLinks } from "@/components/nav/nav-links";
import { NotificationCenter } from "@/components/notifications/notification-center";
import type { AppRole } from "@/types/domain";

interface AppNavProps {
  role?: AppRole;
  email?: string | null;
  name?: string | null;
}

export function AppNav({ role, email, name }: AppNavProps) {
  const publicItems = [
    { label: "Sign in", href: "/sign-in" },
    { label: "Sign up", href: "/sign-up" },
  ];
  const signedInItems = [{ label: "Dashboard", href: "/dashboard" }];
  const roleQuickItems: Record<AppRole, Array<{ label: string; href: string }>> = {
    employee: [
      { label: "Reminders", href: "/employee/reminders" },
      { label: "Messages", href: "/employee/messages" },
      { label: "Appointments", href: "/employee/appointments" },
    ],
    provider: [
      { label: "Availability", href: "/provider/availability" },
      { label: "Appointments", href: "/provider/appointments" },
      { label: "Messages", href: "/provider/messages" },
    ],
    employer_admin: [
      { label: "Analytics", href: "/employer/analytics" },
      { label: "Messages", href: "/employer/messages" },
      { label: "Forecast", href: "/employer/utilization-forecast" },
      { label: "Compliance", href: "/employer/compliance" },
    ],
    system_admin: [
      { label: "Integrations", href: "/admin/integration-apis" },
      { label: "Messages", href: "/admin/messages" },
      { label: "Signals", href: "/admin/early-warning" },
      { label: "Compliance", href: "/employer/compliance" },
    ],
  };
  const quickItems = role ? roleQuickItems[role] : [];
  const brandHref = role ? "/dashboard" : "/";
  const identitySource = name?.trim() || email?.trim() || "User";
  const initial = identitySource.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={brandHref} className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-xs font-bold text-white shadow-sm">
              LH
            </span>
            <span className="leading-tight">
              <span className="block">Lyra Health Platform</span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500">Care Operations</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <LanguageSwitcher />
            {role && <NotificationCenter />}
            <NavLinks items={role ? signedInItems : publicItems} />
            {role && (
              <>
                <span className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 sm:inline-flex">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-[10px] font-semibold text-white">
                    {initial}
                  </span>
                  <span className="max-w-44 truncate">{name ?? email ?? "User"}</span>
                </span>
                <SignOutButton action={signOutAction} />
              </>
            )}
          </nav>
        </div>
        {role && quickItems.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600">
              Quick access
            </span>
            <NavLinks items={quickItems} />
          </div>
        )}
      </div>
    </header>
  );
}
