"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Dices, Languages, Loader2, Sparkles, Stars } from "lucide-react";
import { toast } from "sonner";
import { formatInSystemTimeZone, getSystemTimeZone } from "@/lib/time/client";

interface MatchResult {
  id: string;
  fullName: string;
  specialties: string[];
  languages: string[];
  timezone: string;
  nextAvailableAt: string | null;
  nextAvailabilityId: string | null;
  availableSlots: Array<{
    availabilityId: string;
    startTime: string;
    endTime: string;
  }>;
  score: number;
  fitTier: "excellent" | "strong" | "good" | "baseline";
  reasons: string[];
}

export function MatchResults() {
  const systemTimeZone = useMemo(() => getSystemTimeZone(), []);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});
  const [slotPickerFor, setSlotPickerFor] = useState<string | null>(null);
  const [bookingProviderId, setBookingProviderId] = useState<string | null>(null);
  const matchesQuery = useQuery({
    queryKey: ["provider-matches"],
    queryFn: async () => {
      const response = await fetch("/api/matching");
      const payload = (await response.json().catch(() => null)) as {
        data?: MatchResult[];
        meta?: { requiresAssessment?: boolean };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load recommendations.");
      }
      return {
        matches: payload.data ?? [],
        requiresAssessment: Boolean(payload.meta?.requiresAssessment),
      };
    },
  });

  const matches = matchesQuery.data?.matches ?? [];
  const requiresAssessment = matchesQuery.data?.requiresAssessment ?? false;

  async function handleBook(providerId: string, availabilityId: string | null, label: string) {
    if (!availabilityId) {
      setStatusMessage("This provider has no open slot yet.");
      toast.error("No open slot is available for this provider.");
      return;
    }

    setBookingProviderId(providerId);
    setStatusMessage(`${label}...`);
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, availabilityId, sessionKind: "therapy" }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      const message = payload?.error ?? "Booking failed.";
      setStatusMessage(message);
      toast.error(message);
      setBookingProviderId(null);
      return;
    }

    setStatusMessage("Appointment booked successfully.");
    toast.success("Booked slot successfully.");
    setSlotPickerFor(null);
    setBookingProviderId(null);
    await matchesQuery.refetch();
  }

  function openRandomPicker(match: MatchResult) {
    if (match.availableSlots.length === 0) {
      setStatusMessage("No slots available to book randomly.");
      toast.error("No slots available for this provider.");
      return;
    }

    const randomIndex = Math.floor(Math.random() * match.availableSlots.length);
    const slot = match.availableSlots[randomIndex];
    setSelectedSlots((prev) => ({ ...prev, [match.id]: slot.availabilityId }));
    setSlotPickerFor(match.id);
    setStatusMessage("Random slot preselected. Confirm booking below.");
    toast.info("Random slot preselected. Choose and confirm booking.");
  }

  const status = matchesQuery.isLoading
    ? "Loading recommendations..."
    : matchesQuery.error
      ? (matchesQuery.error as Error).message
      : matches.length > 0
        ? "Recommendations ready."
        : "No providers found.";

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur">
        <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
        <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
          <Sparkles className="h-3.5 w-3.5" />
          Matching Engine
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Therapist matching</h2>
        <p className="mt-1 text-sm text-gray-600">
          Weighted matching across concerns, preferences, cultural fit, and real-time slot availability.
        </p>
        <p className="mt-2 text-xs font-medium text-teal-700">All times shown in {systemTimeZone}</p>
      </div>

      {matchesQuery.isLoading && (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-white/70" />
          ))}
        </div>
      )}

        {matches.map((match) => (
        <article key={match.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{match.fullName}</h3>
              <p className="text-sm text-gray-600">
                {match.specialties.join(", ") || "General care"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Stars className="h-3.5 w-3.5" />
                Score {match.score}
              </span>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-800">
                {match.fitTier} fit
              </span>
            </div>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-600">
            <Languages className="h-4 w-4 text-cyan-600" />
            Languages: {match.languages.join(", ") || "N/A"} | Timezone: {match.timezone}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-600">
            <Clock3 className="h-4 w-4 text-teal-600" />
            Next slot: {match.nextAvailableAt ? formatInSystemTimeZone(match.nextAvailableAt) : "Not available"}
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Match reasons</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {match.reasons.map((reason) => (
              <span
                key={`${match.id}-${reason}`}
                className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700"
              >
                {reason}
              </span>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={!match.nextAvailabilityId || bookingProviderId === match.id}
              onClick={() => handleBook(match.id, match.nextAvailabilityId, "Booking next available slot")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-transform ${
                match.nextAvailabilityId && bookingProviderId !== match.id
                  ? "bg-gradient-to-r from-teal-600 to-cyan-500 text-white hover:-translate-y-0.5"
                  : "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-500"
              }`}
            >
              {bookingProviderId === match.id ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Booking...
                </span>
              ) : match.nextAvailabilityId ? (
                "Book next available slot"
              ) : (
                "No open slot yet"
              )}
            </button>
            <button
              type="button"
              disabled={match.availableSlots.length === 0 || bookingProviderId === match.id}
              onClick={() => openRandomPicker(match)}
              className={`inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                match.availableSlots.length > 0 && bookingProviderId !== match.id
                  ? "border border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                  : "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-500"
              }`}
            >
              <Dices className="h-4 w-4" />
              Book random slot
            </button>
          </div>
          {slotPickerFor === match.id && (
            <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/50 p-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">
                  Select a slot to book
                </label>
                <button
                  type="button"
                  onClick={() => setSlotPickerFor(null)}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                A random slot has been pre-selected. Change it below or confirm to book.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={selectedSlots[match.id] ?? match.availableSlots[0]?.availabilityId ?? ""}
                  onChange={(event) =>
                    setSelectedSlots((prev) => ({ ...prev, [match.id]: event.target.value }))
                  }
                  className="min-w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                >
                  {match.availableSlots.length === 0 && (
                    <option value="">No slots available</option>
                  )}
                  {match.availableSlots.map((slot) => (
                    <option key={slot.availabilityId} value={slot.availabilityId}>
                      {formatInSystemTimeZone(slot.startTime)} - {formatInSystemTimeZone(slot.endTime, { includeDate: false })}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={match.availableSlots.length === 0 || bookingProviderId === match.id}
                  onClick={() =>
                    handleBook(
                      match.id,
                      selectedSlots[match.id] ?? match.availableSlots[0]?.availabilityId ?? null,
                      "Booking selected slot",
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    match.availableSlots.length > 0 && bookingProviderId !== match.id
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-500"
                  }`}
                >
                  {bookingProviderId === match.id ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Booking...
                    </span>
                  ) : (
                    "Confirm and book slot"
                  )}
                </button>
              </div>
            </div>
          )}
        </article>
      ))}

      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">{statusMessage ?? status}</p>
      {requiresAssessment && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Complete self-assessment to improve match quality and ranking accuracy.
        </p>
      )}
    </div>
  );
}
