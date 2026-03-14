"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, Filter, Globe2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string;
}

export function ResourcesPanel() {
  const [category, setCategory] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const resourcesQuery = useQuery({
    queryKey: ["resources", appliedCategory],
    queryFn: async () => {
      const query = appliedCategory ? `?category=${encodeURIComponent(appliedCategory)}` : "";
      const response = await fetch(`/api/resources${query}`);
      const payload = (await response.json().catch(() => null)) as {
        data?: Resource[];
        error?: string;
      };
      if (!response.ok) {
        const message = payload?.error ?? "Failed to load resources.";
        toast.error(message);
        throw new Error(message);
      }
      setIsFiltering(false);
      return payload.data ?? [];
    },
  });

  const resources = resourcesQuery.data ?? [];
  const status = resourcesQuery.isLoading
    ? "Loading resources..."
    : resourcesQuery.error
      ? (resourcesQuery.error as Error).message
      : resources.length > 0
        ? "Resources loaded."
        : "No resources available.";

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur">
        <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
          <BookOpenCheck className="h-3.5 w-3.5" />
          Learning Hub
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Resource library</h2>
        <p className="mt-1 text-sm text-gray-600">
          Curated reading, exercises, and self-help materials.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Filter category (e.g. stress)"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100 md:flex-1"
          />
          <button
            type="button"
            disabled={isFiltering}
            onClick={() => {
              setIsFiltering(true);
              setAppliedCategory(category.trim());
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 ${isFiltering ? "is-loading opacity-80" : ""}`}
          >
            {isFiltering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            {isFiltering ? "Filtering..." : "Filter"}
          </button>
        </div>
      </div>

      {resourcesQuery.isLoading && (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white/70" />
          ))}
        </div>
      )}

      {resources.map((resource) => (
        <article key={resource.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{resource.description}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500">
            <Globe2 className="h-3.5 w-3.5" />
            {resource.category}
          </p>
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Open resource
          </a>
        </article>
      ))}

      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">{status}</p>
    </div>
  );
}
