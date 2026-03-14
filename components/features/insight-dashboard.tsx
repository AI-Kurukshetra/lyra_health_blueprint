"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";

interface InsightDashboardProps {
  kind: "early-warning" | "workplace-stress" | "team-insights" | "utilization-forecast" | "roi" | "sentiment";
  title: string;
  description: string;
}

export function InsightDashboard({ kind, title, description }: InsightDashboardProps) {
  const insightQuery = useQuery({
    queryKey: ["insight-dashboard", kind],
    queryFn: async () => {
      const response = await fetch(`/api/insights/${kind}`);
      const payload = (await response.json().catch(() => null)) as {
        data?: Record<string, unknown> | Array<Record<string, unknown>>;
        summary?: Record<string, unknown>;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load insight.");
      }
      return payload;
    },
  });

  const data = insightQuery.data?.data;
  const summary = insightQuery.data?.summary;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur">
        <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
          <Activity className="h-3.5 w-3.5" />
          Live Insight
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </section>

      {insightQuery.isLoading && (
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white/70" />
          ))}
        </div>
      )}

      {!insightQuery.isLoading && !insightQuery.error && Array.isArray(data) && (
        <div className="space-y-3">
          {data.map((entry, index) => (
            <article key={index} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(entry).map(([key, value]) => (
                  <span
                    key={key}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700"
                  >
                    {key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {!insightQuery.isLoading && !insightQuery.error && data && !Array.isArray(data) && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data).map(([key, value]) => (
            <article key={key} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{key}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{String(value)}</p>
            </article>
          ))}
        </div>
      )}

      {summary && Object.keys(summary).length > 0 && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Summary</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(summary).map(([key, value]) => (
              <span
                key={key}
                className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-xs text-cyan-800"
              >
                {key}: {String(value)}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
        {insightQuery.error
          ? (insightQuery.error as Error).message
          : insightQuery.isLoading
            ? "Loading..."
            : "Insight ready."}
      </p>
    </div>
  );
}
