"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { formatInSystemTimeZone, getSystemTimeZone } from "@/lib/time/client";

interface FeatureRecord {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  payload: Record<string, unknown>;
  starts_at: string | null;
  created_at: string;
}

export interface FeatureField {
  key: string;
  label: string;
  placeholder?: string;
  type: "text" | "textarea";
}

interface FeatureBoardProps {
  featureKey: string;
  heading: string;
  description: string;
  fields?: FeatureField[];
  statusOptions?: string[];
  scope?: "mine" | "org";
}

export function FeatureBoard({
  featureKey,
  heading,
  description,
  fields = [],
  statusOptions = ["active", "planned", "in_progress", "completed"],
  scope = "mine",
}: FeatureBoardProps) {
  const systemTimeZone = useMemo(() => getSystemTimeZone(), []);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [status, setStatus] = useState(statusOptions[0] ?? "active");
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const featuresQuery = useQuery({
    queryKey: ["feature-board", featureKey, scope],
    queryFn: async () => {
      const response = await fetch(`/api/features/${featureKey}?scope=${scope}`);
      const payload = (await response.json().catch(() => null)) as {
        data?: FeatureRecord[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load feature records.");
      }
      return payload.data ?? [];
    },
  });

  const sortedRecords = useMemo(
    () =>
      [...(featuresQuery.data ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [featuresQuery.data],
  );

  async function createRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("Saving...");
    setIsSaving(true);

    const payload = fields.reduce<Record<string, string>>((accumulator, field) => {
      accumulator[field.key] = extraFields[field.key] ?? "";
      return accumulator;
    }, {});

    const response = await fetch(`/api/features/${featureKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        status,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        payload,
      }),
    });
    const result = (await response.json().catch(() => null)) as { error?: string };
    if (!response.ok) {
      const message = result?.error ?? "Failed to save.";
      setStatusMessage(message);
      toast.error(message);
      setIsSaving(false);
      return;
    }

    setTitle("");
    setSummary("");
    setStartsAt("");
    setStatus(statusOptions[0] ?? "active");
    setExtraFields({});
    setStatusMessage("Saved successfully.");
    toast.success("Saved successfully.");
    setIsSaving(false);
    await featuresQuery.refetch();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={createRecord}
        className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{heading}</p>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
        <p className="mt-1 text-xs font-medium text-teal-700">All times shown in {systemTimeZone}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Summary</span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="min-h-20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          />
        </label>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Start time (optional)</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </label>
        </div>

        {fields.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea
                    value={extraFields[field.key] ?? ""}
                    onChange={(event) =>
                      setExtraFields((prev) => ({ ...prev, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="min-h-20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                ) : (
                  <input
                    value={extraFields[field.key] ?? ""}
                    onChange={(event) =>
                      setExtraFields((prev) => ({ ...prev, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                )}
              </label>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 ${isSaving ? "is-loading opacity-80" : ""}`}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          {isSaving ? "Saving..." : "Save entry"}
        </button>
      </form>

      {featuresQuery.isLoading && (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white/70" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {sortedRecords.map((record) => (
          <article
            key={record.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{record.summary}</p>
              </div>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-700">
                {record.status}
              </span>
            </div>
            {record.starts_at && (
              <p className="mt-2 text-xs text-gray-500">Starts: {formatInSystemTimeZone(record.starts_at)}</p>
            )}
            {Object.keys(record.payload ?? {}).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(record.payload).map(([key, value]) => (
                  <span
                    key={`${record.id}-${key}`}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {!featuresQuery.isLoading && sortedRecords.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
          No records yet. Create your first entry above.
        </p>
      )}

      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
        {statusMessage ??
          (featuresQuery.error
            ? (featuresQuery.error as Error).message
            : "Feature records loaded.")}
      </p>
    </div>
  );
}
