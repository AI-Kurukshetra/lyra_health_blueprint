"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChartLine, HeartPulse, Loader2, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { formatInSystemTimeZone, getSystemTimeZone } from "@/lib/time/client";

interface MoodEntry {
  id: string;
  mood_score: number;
  notes: string | null;
  created_at: string;
}

export function ProgressPanel() {
  const systemTimeZone = useMemo(() => getSystemTimeZone(), []);
  const [moodScore, setMoodScore] = useState(6);
  const [notes, setNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const moodsQuery = useQuery({
    queryKey: ["mood-entries"],
    queryFn: async () => {
      const response = await fetch("/api/moods");
      const payload = (await response.json().catch(() => null)) as {
        data?: MoodEntry[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load mood entries.");
      }
      return payload.data ?? [];
    },
  });

  const entries = moodsQuery.data ?? [];
  const averageMood =
    entries.length === 0
      ? null
      : Number(
          (entries.reduce((sum, entry) => sum + entry.mood_score, 0) / entries.length).toFixed(2),
        );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("Saving mood entry...");
    setIsSaving(true);

    const response = await fetch("/api/moods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodScore, notes }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string };
    if (!response.ok) {
      const message = payload?.error ?? "Failed to save mood entry.";
      setStatusMessage(message);
      toast.error(message);
      setIsSaving(false);
      return;
    }

    setNotes("");
    setStatusMessage("Mood entry saved.");
    toast.success("Mood entry saved successfully.");
    setIsSaving(false);
    await moodsQuery.refetch();
  }

  const status = moodsQuery.isLoading
    ? "Loading mood trend..."
    : moodsQuery.error
      ? (moodsQuery.error as Error).message
      : "Mood entries loaded.";

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur">
        <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
          <HeartPulse className="h-3.5 w-3.5" />
          Daily Check-In
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Mood tracking</h2>
        <p className="mt-1 text-sm text-gray-600">
          Log your daily mood and monitor progress trends.
        </p>
        <p className="mt-2 text-xs font-medium text-teal-700">All times shown in {systemTimeZone}</p>
        <label className="mt-4 block rounded-2xl border border-gray-200 bg-white p-4">
          <span className="mb-2 block text-sm font-semibold text-gray-700">
            Mood score (1-10): {moodScore}
          </span>
          <input
            type="range"
            min={1}
            max={10}
            value={moodScore}
            onChange={(event) => setMoodScore(Number(event.target.value))}
            className="w-full accent-teal-600"
          />
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
              style={{ width: `${Math.min(100, moodScore * 10)}%` }}
            />
          </div>
        </label>
        <label className="mt-3 block rounded-2xl border border-gray-200 bg-white p-4">
          <span className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
            <NotebookPen className="h-4 w-4 text-teal-700" />
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            placeholder="Optional context for this mood check-in."
          />
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className={`mt-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 ${isSaving ? "is-loading opacity-80" : ""}`}
        >
          {isSaving ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save mood entry"
          )}
        </button>
      </form>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="inline-flex items-center gap-1.5 text-base font-semibold text-gray-900">
          <ChartLine className="h-4 w-4 text-cyan-600" />
          Trend summary
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Average mood score: {averageMood ?? "No entries yet"}
        </p>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
            <p className="text-sm font-medium text-gray-900">
              {formatInSystemTimeZone(entry.created_at)} | Score {entry.mood_score}
            </p>
            {entry.notes && <p className="mt-1 text-sm text-gray-600">{entry.notes}</p>}
          </article>
        ))}
      </div>

      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">{statusMessage ?? status}</p>
    </div>
  );
}
