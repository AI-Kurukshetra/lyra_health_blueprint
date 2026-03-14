"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  LogIn,
  MessageSquareHeart,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

interface NavLinksProps {
  items: NavItem[];
}

const navMeta: Record<string, { icon: React.ComponentType<{ className?: string }> }> = {
  "/sign-in": { icon: LogIn },
  "/sign-up": { icon: UserPlus },
  "/dashboard": { icon: LayoutDashboard },
  "/employee/match": { icon: Sparkles },
  "/employee/appointments": { icon: CalendarDays },
  "/employee/messages": { icon: MessageSquareHeart },
  "/provider/availability": { icon: CalendarClock },
  "/provider/appointments": { icon: CalendarDays },
  "/provider/messages": { icon: MessageSquareHeart },
  "/employer/messages": { icon: MessageSquareHeart },
  "/employer/analytics": { icon: BarChart3 },
  "/employer/utilization-forecast": { icon: Activity },
  "/employer/compliance": { icon: ShieldCheck },
  "/admin/integration-apis": { icon: ShieldCheck },
  "/admin/messages": { icon: MessageSquareHeart },
  "/admin/early-warning": { icon: Activity },
};

export function NavLinks({ items }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const meta = navMeta[item.href] ?? { icon: PanelsTopLeft };
        const Icon = meta.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group rounded-xl border px-3 py-2 transition-all ${
              active
                ? "border-teal-200 bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/50 hover:text-gray-900"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Icon className={`h-4 w-4 ${active ? "text-white" : "text-teal-700"} transition-colors`} />
              <span className="text-sm font-semibold">{item.label}</span>
            </span>
          </Link>
        );
      })}
    </>
  );
}
