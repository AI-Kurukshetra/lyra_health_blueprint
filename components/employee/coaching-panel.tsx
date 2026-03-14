"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass, Loader2, Sparkles, Target, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { formatInSystemTimeZone, getSystemTimeZone } from "@/lib/time/client";

interface CoachingPlan {
  id: string;
  focus_areas: string[];
  goals: string;
  preferred_frequency: "weekly" | "biweekly" | "monthly";
  status: string;
}

interface CoachMatch {
  id: string;
  fullName: string;
  coachingFocusAreas: string[];
  languages: string[];
  timezone: string;
  nextAvailableAt: string | null;
  nextAvailabilityId: string | null;
  score: number;
  reasons: string[];
}

const focusOptions = ["stress", "burnout", "sleep", "resilience", "confidence", "work_life_balance"];

export function CoachingPanel() {
  const systemTimeZone = useMemo(() => getSystemTimeZone(), []);
  const [selectedFocus, setSelectedFocus] = useState<string[]>(["stress"]);
  const [goals, setGoals] = useState("");
  const [preferredFrequency, setPreferredFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [bookingCoachId, setBookingCoachId] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ["coaching-plans"],
    queryFn: async () => {
      const response = await fetch("/api/coaching/plans");
      const payload = (await response.json().catch(() => null)) as { data?: CoachingPlan[]; error?: string };
      if (!response.ok) throw new Error(payload?.error ?? "Failed to load coaching plans.");
      return payload.data ?? [];
    },
  });

  const matchingQuery = useQuery({
    queryKey: ["coaching-matches"],
    queryFn: async () => {
      const response = await fetch("/api/coaching/matching");
      const payload = (await response.json().catch(() => null)) as { data?: CoachMatch[]; error?: string };
      if (!response.ok) throw new Error(payload?.error ?? "Failed to load coaching matches.");
      return payload.data ?? [];
    },
  });

  const plans = plansQuery.data ?? [];
  const coaches = matchingQuery.data ?? [];
  const activePlan = plans[0];

  function toggleFocus(area: string) {
    setSelectedFocus((prev) =>
      prev.includes(area) ? prev.filter((value) => value !== area) : [...prev, area],
    );
  }

  async function createPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("Creating coaching plan...");
    setIsSavingPlan(true);

    const response = await fetch("/api/coaching/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        focusAreas: selectedFocus,
        goals,
        preferredFrequency,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      const message = payload?.error ?? "Failed to create coaching plan.";
      setStatusMessage(message);
      toast.error(message);
      setIsSavingPlan(false);
      return;
    }

    setGoals("");
    setStatusMessage("Coaching plan saved.");
    toast.success("Coaching plan saved successfully.");
    setIsSavingPlan(false);
    await Promise.all([plansQuery.refetch(), matchingQuery.refetch()]);
  }

  async function bookCoach(providerId: string, availabilityId: string | null) {
    if (!availabilityId) {
      setStatusMessage("This coach has no open slot yet.");
      toast.error("No open coaching slot available.");
      return;
    }

    setBookingCoachId(providerId);
    setStatusMessage("Booking coaching session...");
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId,
        availabilityId,
        sessionKind: "coaching",
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      const message = payload?.error ?? "Failed to book coaching session.";
      setStatusMessage(message);
      toast.error(message);
      setBookingCoachId(null);
      return;
    }

    setStatusMessage("Coaching session booked.");
    toast.success("Coaching session booked successfully.");
    setBookingCoachId(null);
    await matchingQuery.refetch();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={createPlan}
        className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
          <Target className="h-3.5 w-3.5" />
          Mental Health Coaching
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Build your coaching plan</h2>
        <p className="mt-1 text-sm text-gray-600">
          Set practical goals and get matched with a coach for lower-severity support.
        </p>
        <p className="mt-2 text-xs font-medium text-teal-700">All times shown in {systemTimeZone}</p>

        <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-semibold text-gray-700">Focus areas</legend>
          <div className="flex flex-wrap gap-2">
            {focusOptions.map((focus) => (
              <button
                key={focus}
                type="button"
                onClick={() => toggleFocus(focus)}
                className={`rounded-full border px-3 py-1.5 text-sm capitalize ${
                  selectedFocus.includes(focus)
                    ? "border-teal-600 bg-teal-50 text-teal-800"
                    : "border-gray-300 text-gray-700 hover:border-teal-300"
                }`}
              >
                {focus.replace("_", " ")}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-semibold text-gray-700">Goal statement</span>
          <textarea
            value={goals}
            onChange={(event) => setGoals(event.target.value)}
            required
            className="min-h-24 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            placeholder="Example: Improve stress management and maintain work-life boundaries."
          />
        </label>

        <fieldset className="mt-3 space-y-2">
          <legend className="text-sm font-semibold text-gray-700">Preferred frequency</legend>
          <div className="flex flex-wrap gap-2">
            {(["weekly", "biweekly", "monthly"] as const).map((frequency) => (
              <button
                key={frequency}
                type="button"
                onClick={() => setPreferredFrequency(frequency)}
                className={`rounded-full border px-3 py-1.5 text-sm capitalize ${
                  preferredFrequency === frequency
                    ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                    : "border-gray-300 text-gray-700 hover:border-cyan-300"
                }`}
              >
                {frequency}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isSavingPlan}
          className={`mt-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 ${isSavingPlan ? "is-loading opacity-80" : ""}`}
        >
          {isSavingPlan ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save coaching plan"
          )}
        </button>
      </form>

      {activePlan && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="inline-flex items-center gap-1.5 text-base font-semibold text-gray-900">
            <Compass className="h-4 w-4 text-teal-700" />
            Active coaching plan
          </h3>
          <p className="mt-2 text-sm text-gray-700">{activePlan.goals}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.12em] text-gray-500">
            Frequency: {activePlan.preferred_frequency}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {coaches.map((coach) => (
          <article
            key={coach.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{coach.fullName}</h3>
                <p className="text-sm text-gray-600">
                  Focus: {coach.coachingFocusAreas.join(", ") || "General coaching"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Sparkles className="h-3.5 w-3.5" />
                Score {coach.score}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Languages: {coach.languages.join(", ") || "N/A"} | Timezone: {coach.timezone}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Next coaching slot: {coach.nextAvailableAt ? formatInSystemTimeZone(coach.nextAvailableAt) : "No slot"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Reasons: {coach.reasons.join(", ")}
            </p>
            <button
              type="button"
              disabled={!coach.nextAvailabilityId || bookingCoachId === coach.id}
              onClick={() => bookCoach(coach.id, coach.nextAvailabilityId)}
              className={`mt-3 rounded-xl px-4 py-2 text-sm font-semibold ${
                coach.nextAvailabilityId && bookingCoachId !== coach.id
                  ? "bg-gradient-to-r from-teal-600 to-cyan-500 text-white"
                  : "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-500"
              }`}
            >
              {bookingCoachId === coach.id ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Booking...
                </span>
              ) : coach.nextAvailabilityId ? (
                "Book coaching session"
              ) : (
                "No slot yet"
              )}
            </button>
          </article>
        ))}
      </div>

      {(statusMessage || plansQuery.isLoading || matchingQuery.isLoading) && (
        <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          {statusMessage ??
            (plansQuery.isLoading || matchingQuery.isLoading
              ? "Loading coaching data..."
              : "Ready")}
        </p>
      )}
      {coaches.length === 0 && !matchingQuery.isLoading && (
        <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          No coaches available yet in your organization.
        </p>
      )}
      <p className="inline-flex items-center gap-1 text-xs text-gray-500">
        <UsersRound className="h-3.5 w-3.5" />
        Coaching is intended for lower-severity support and habit building.
      </p>
    </div>
  );
}
