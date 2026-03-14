"use client";

import { useQuery } from "@tanstack/react-query";
import { HeartHandshake } from "lucide-react";
import { toast } from "sonner";

interface Intervention {
  id: string;
  concern: string;
  suggestion: string;
  durationMinutes: number;
}

export function MicroInterventionsPanel() {
  const interventionsQuery = useQuery({
    queryKey: ["micro-interventions"],
    queryFn: async () => {
      const response = await fetch("/api/micro-interventions");
      const payload = (await response.json().catch(() => null)) as {
        data?: Intervention[];
        error?: string;
      };
      if (!response.ok) {
        const message = payload?.error ?? "Failed to load interventions.";
        toast.error(message);
        throw new Error(message);
      }
      return payload.data ?? [];
    },
  });

  const interventions = interventionsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur">
        <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
          <HeartHandshake className="h-3.5 w-3.5" />
          Personalized Micro-Interventions
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Daily support actions</h2>
        <p className="mt-1 text-sm text-gray-600">
          Data-informed exercises aligned to your latest concerns.
        </p>
      </section>

      {interventionsQuery.isLoading && (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white/70" />
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {interventions.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              Concern: {entry.concern}
            </p>
            <p className="mt-2 text-sm text-gray-700">{entry.suggestion}</p>
            <p className="mt-3 inline-flex rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
              {entry.durationMinutes} min action
            </p>
          </article>
        ))}
      </div>

      {!interventionsQuery.isLoading && interventions.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
          No interventions available yet. Complete self-assessment for personalization.
        </p>
      )}

      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
        {interventionsQuery.error
          ? (interventionsQuery.error as Error).message
          : interventionsQuery.isLoading
            ? "Loading personalized support..."
            : "Interventions ready."}
      </p>
    </div>
  );
}
