import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RolePageShellProps {
  title: string;
  subtitle: string;
  roleLabel: string;
  backHref?: string;
  children: React.ReactNode;
}

export function RolePageShell({
  title,
  subtitle,
  roleLabel,
  backHref = "/dashboard",
  children,
}: RolePageShellProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-5 rounded-2xl border border-gray-200 bg-white/85 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
            <Link href={backHref} className="inline-flex items-center gap-1 hover:text-gray-700">
              <ChevronLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-700">{title}</span>
          </p>
          <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
            {roleLabel}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
