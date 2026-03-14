import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface EmployeePageShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function EmployeePageShell({ title, subtitle, children }: EmployeePageShellProps) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-5 rounded-2xl border border-gray-200 bg-white/80 p-4 backdrop-blur">
        <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-700">
            Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-700">{title}</span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
