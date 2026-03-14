"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsSummary {
  totalEmployees: number;
  totalProviders: number;
  assessmentsLast30Days: number;
  totalAppointments: number;
  completedSessionsLast30Days: number;
  avgTimeToFirstAppointmentDays: number | null;
}

const metricLabels: Array<{ key: keyof AnalyticsSummary; label: string; suffix?: string }> = [
  { key: "totalEmployees", label: "Employees" },
  { key: "totalProviders", label: "Providers" },
  { key: "assessmentsLast30Days", label: "Assessments (30d)" },
  { key: "totalAppointments", label: "Appointments" },
  { key: "completedSessionsLast30Days", label: "Completed Sessions (30d)" },
  { key: "avgTimeToFirstAppointmentDays", label: "Avg Time to First Appointment", suffix: " days" },
];

export function EmployerAnalyticsPanel() {
  const analyticsQuery = useQuery({
    queryKey: ["employer-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/employer/analytics");
      const payload = (await response.json().catch(() => null)) as {
        data?: AnalyticsSummary;
        error?: string;
      };
      if (!response.ok || !payload?.data) {
        const message = payload?.error ?? "Failed to load analytics.";
        toast.error(message);
        throw new Error(message);
      }
      return payload.data;
    },
  });

  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur">
        <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
          <BarChart3 className="h-3.5 w-3.5" />
          Employer KPI View
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Organization analytics</h2>
        <p className="mt-1 text-sm text-gray-600">
          Aggregated and anonymized adoption, access, and utilization indicators.
        </p>
      </section>

      {analyticsQuery.isLoading && (
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white/70" />
          ))}
        </div>
      )}

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metricLabels.map((metric) => (
            <article key={metric.key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {String(analytics[metric.key] ?? "N/A")}
                {metric.suffix ?? ""}
              </p>
            </article>
          ))}
        </div>
      )}

      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
        {analyticsQuery.error
          ? (analyticsQuery.error as Error).message
          : analyticsQuery.isLoading
            ? "Loading analytics..."
            : "Analytics loaded."}
      </p>
    </div>
  );
}
