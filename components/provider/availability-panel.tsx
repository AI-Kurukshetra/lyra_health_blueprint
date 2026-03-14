"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dices, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  addMinutes,
  formatDateTimeLocalInput,
  formatInSystemTimeZone,
  getSystemTimeZone,
  parseDateTimeLocalInput,
} from "@/lib/time/client";

interface AvailabilitySlot {
  id: string;
  start_time: string;
  end_time: string;
  session_kind: "therapy" | "coaching";
  is_booked: boolean;
}

export function ProviderAvailabilityPanel() {
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [sessionKind, setSessionKind] = useState<"therapy" | "coaching">("therapy");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const systemTimeZone = useMemo(() => getSystemTimeZone(), []);
  const computedEndTime = useMemo(() => {
    const parsed = parseDateTimeLocalInput(startTime);
    if (!parsed) return "";
    return formatDateTimeLocalInput(addMinutes(parsed, durationMinutes));
  }, [durationMinutes, startTime]);
  const slotsQuery = useQuery({
    queryKey: ["provider-availability"],
    queryFn: async () => {
      const response = await fetch("/api/provider/availability");
      const payload = (await response.json().catch(() => null)) as {
        data?: AvailabilitySlot[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load availability.");
      }
      return payload.data ?? [];
    },
  });

  const slots = slotsQuery.data ?? [];

  function setRandomStartTime() {
    const now = new Date();
    const randomMinutesFromNow = 30 + Math.floor(Math.random() * 48) * 15;
    const randomStart = addMinutes(now, randomMinutesFromNow);
    randomStart.setSeconds(0, 0);
    setStartTime(formatDateTimeLocalInput(randomStart));
    toast.info("Random slot start selected.");
  }

  async function handleCreateSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!computedEndTime) {
      const message = "Select a valid start time to calculate end time.";
      setStatusMessage(message);
      toast.error(message);
      return;
    }

    setStatusMessage("Creating slot...");
    setIsCreating(true);

    const response = await fetch("/api/provider/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startTime,
        endTime: computedEndTime,
        sessionKind,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      const message = payload?.error ?? "Failed to create slot.";
      setStatusMessage(message);
      toast.error(message);
      setIsCreating(false);
      return;
    }

    setStartTime("");
    setDurationMinutes(45);
    setSessionKind("therapy");
    setStatusMessage("Availability slot created.");
    toast.success("Availability slot created successfully.");
    setIsCreating(false);
    await slotsQuery.refetch();
  }

  const status = slotsQuery.isLoading
    ? "Loading availability..."
    : slotsQuery.error
      ? (slotsQuery.error as Error).message
      : "Availability loaded.";

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreateSlot} className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Set availability</h2>
        <p className="mt-1 text-sm text-gray-600">Create open slots for employee bookings.</p>
        <p className="mt-1 text-xs font-medium text-teal-700">Current timezone: {systemTimeZone}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Start time</span>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Duration (minutes)</span>
            <input
              type="number"
              min={15}
              step={5}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value) || 45)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={setRandomStartTime}
            className="inline-flex items-center gap-1 rounded-md border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100"
          >
            <Dices className="h-4 w-4" />
            Pick random start
          </button>
          <p className="text-sm text-gray-600">
            Auto end time:{" "}
            <span className="font-semibold text-gray-800">
              {computedEndTime
                ? formatInSystemTimeZone(parseDateTimeLocalInput(computedEndTime) ?? computedEndTime)
                : "Select start time"}
            </span>
          </p>
        </div>
        <fieldset className="mt-3 rounded-lg border border-gray-200 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Session kind
          </legend>
          <div className="flex gap-2">
            {(["therapy", "coaching"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setSessionKind(kind)}
                className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                  sessionKind === kind
                    ? "border-teal-700 bg-teal-50 text-teal-800"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {kind}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={isCreating}
          className={`mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 ${isCreating ? "is-loading opacity-80" : ""}`}
        >
          {isCreating ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </span>
          ) : (
            "Add slot"
          )}
        </button>
      </form>

      {slots.map((slot) => (
        <article key={slot.id} className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-900">
            {formatInSystemTimeZone(slot.start_time)} - {formatInSystemTimeZone(slot.end_time)}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {slot.is_booked ? "Booked" : "Open"} | <span className="font-medium capitalize">{slot.session_kind}</span>
          </p>
        </article>
      ))}

      <p className="text-sm text-gray-700">{statusMessage ?? status}</p>
    </div>
  );
}
