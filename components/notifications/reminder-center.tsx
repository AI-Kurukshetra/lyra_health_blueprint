"use client";

import type { ComponentType, FormEvent } from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarClock, CheckCircle2, Loader2, Pill, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ReminderType = "appointment" | "medication" | "wellness";
type ReminderStatus = "active" | "completed" | "cancelled";

interface ReminderRecord {
  id: string;
  reminder_type: ReminderType;
  title: string;
  details: string | null;
  remind_at: string;
  timezone: string | null;
  repeat_interval_minutes: number | null;
  status: ReminderStatus;
  notified_at: string | null;
  created_at: string;
}

const reminderTypeOptions: Array<{ value: ReminderType; label: string; icon: ComponentType<{ className?: string }> }> = [
  { value: "appointment", label: "Appointment", icon: CalendarClock },
  { value: "medication", label: "Medication", icon: Pill },
  { value: "wellness", label: "Wellness Activity", icon: Sparkles },
];

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseDateTimeLocal(value: string): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function ReminderCenter() {
  const systemTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );
  const [reminderType, setReminderType] = useState<ReminderType>("wellness");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [repeatIntervalMinutes, setRepeatIntervalMinutes] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const remindersQuery = useQuery({
    queryKey: ["automated-reminders"],
    queryFn: async () => {
      const response = await fetch("/api/reminders");
      const payload = (await response.json().catch(() => null)) as {
        data?: ReminderRecord[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load reminders.");
      }
      return payload.data ?? [];
    },
    refetchInterval: 30_000,
  });

  const reminders = remindersQuery.data;
  const activeReminders = useMemo(
    () => (reminders ?? []).filter((entry) => entry.status === "active"),
    [reminders],
  );
  const pastReminders = useMemo(
    () => (reminders ?? []).filter((entry) => entry.status !== "active"),
    [reminders],
  );

  function presetReminder(minutes: number) {
    const nextDate = new Date();
    nextDate.setMinutes(nextDate.getMinutes() + minutes);
    setRemindAt(formatDateTimeLocal(nextDate));
  }

  async function createReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("Creating reminder...");
    setIsCreating(true);

    const parsedRemindAt = parseDateTimeLocal(remindAt);
    if (!parsedRemindAt) {
      const message = "Please select a valid reminder date and time.";
      setStatusMessage(message);
      toast.error(message);
      setIsCreating(false);
      return;
    }

    const response = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reminderType,
        title,
        details,
        remindAt: parsedRemindAt.toISOString(),
        timezone: systemTimezone,
        repeatIntervalMinutes: repeatIntervalMinutes.trim() ? Number(repeatIntervalMinutes) : undefined,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      const message = payload?.error ?? "Failed to create reminder.";
      setStatusMessage(message);
      toast.error(message);
      setIsCreating(false);
      return;
    }

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }

    setTitle("");
    setDetails("");
    setRemindAt("");
    setRepeatIntervalMinutes("");
    setStatusMessage("Reminder configured successfully.");
    toast.success("Reminder configured successfully.");
    setIsCreating(false);
    await remindersQuery.refetch();
  }

  async function updateReminderStatus(id: string, status: ReminderStatus) {
    setUpdatingId(id);
    setStatusMessage("Updating reminder...");

    const response = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      const message = payload?.error ?? "Failed to update reminder.";
      setStatusMessage(message);
      toast.error(message);
      setUpdatingId(null);
      return;
    }

    setStatusMessage(`Reminder marked as ${status}.`);
    toast.success(`Reminder marked as ${status}.`);
    setUpdatingId(null);
    await remindersQuery.refetch();
  }

  async function deleteReminder(id: string) {
    setUpdatingId(id);
    setStatusMessage("Removing reminder...");

    const response = await fetch(`/api/reminders/${id}`, {
      method: "DELETE",
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      const message = payload?.error ?? "Failed to delete reminder.";
      setStatusMessage(message);
      toast.error(message);
      setUpdatingId(null);
      return;
    }

    setStatusMessage("Reminder removed.");
    toast.success("Reminder removed.");
    setUpdatingId(null);
    await remindersQuery.refetch();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={createReminder}
        className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
          <Bell className="h-3.5 w-3.5" />
          Smart Reminder Configuration
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Automated reminders</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure reminders for appointments, medication, and wellness activities.
        </p>
        <p className="mt-2 text-xs font-medium text-teal-700">
          Using system timezone: {systemTimezone}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {reminderTypeOptions.map((option) => {
            const Icon = option.icon;
            const active = reminderType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setReminderType(option.value)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                  active
                    ? "border-teal-300 bg-teal-50 text-teal-800"
                    : "border-gray-300 bg-white text-gray-700 hover:border-teal-200"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Reminder title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder={
                reminderType === "appointment"
                  ? "Therapy session prep"
                  : reminderType === "medication"
                    ? "Take evening medication"
                    : "10-minute breathing exercise"
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Reminder time</span>
            <input
              type="datetime-local"
              value={remindAt}
              onChange={(event) => setRemindAt(event.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[5, 10, 15, 30, 60].map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => presetReminder(minutes)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-teal-200 hover:bg-teal-50"
            >
              In {minutes} min
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Repeat interval (minutes)</span>
            <input
              type="number"
              min={1}
              value={repeatIntervalMinutes}
              onChange={(event) => setRepeatIntervalMinutes(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              placeholder="Optional"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Details</span>
            <input
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="Optional details"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className={`mt-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 ${isCreating ? "is-loading opacity-80" : ""}`}
        >
          {isCreating ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving reminder...
            </span>
          ) : (
            "Save reminder"
          )}
        </button>
      </form>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Active reminders</h3>
        <div className="mt-3 space-y-2">
          {activeReminders.map((reminder) => (
            <article key={reminder.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-900">{reminder.title}</p>
              <p className="text-xs text-gray-600">
                Type: {reminder.reminder_type} | At:{" "}
                {new Date(reminder.remind_at).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: reminder.timezone ?? systemTimezone,
                  timeZoneName: "short",
                })}
              </p>
              {reminder.details && <p className="mt-1 text-sm text-gray-700">{reminder.details}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={updatingId === reminder.id}
                  onClick={() => updateReminderStatus(reminder.id, "completed")}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800"
                >
                  <span className="inline-flex items-center gap-1">
                    {updatingId === reminder.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Complete
                  </span>
                </button>
                <button
                  type="button"
                  disabled={updatingId === reminder.id}
                  onClick={() => updateReminderStatus(reminder.id, "cancelled")}
                  className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingId === reminder.id}
                  onClick={() => deleteReminder(reminder.id)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-800"
                >
                  <span className="inline-flex items-center gap-1">
                    {updatingId === reminder.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Remove
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
        {!remindersQuery.isLoading && activeReminders.length === 0 && (
          <p className="mt-3 text-sm text-gray-600">No active reminders configured.</p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Completed or cancelled</h3>
        <div className="mt-3 space-y-2">
          {pastReminders.map((reminder) => (
            <article key={reminder.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-900">{reminder.title}</p>
              <p className="text-xs text-gray-600">
                {reminder.status} |{" "}
                {new Date(reminder.remind_at).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: reminder.timezone ?? systemTimezone,
                  timeZoneName: "short",
                })}
              </p>
            </article>
          ))}
        </div>
        {!remindersQuery.isLoading && pastReminders.length === 0 && (
          <p className="mt-3 text-sm text-gray-600">No past reminders yet.</p>
        )}
      </section>

      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
        {statusMessage ??
          (remindersQuery.error
            ? (remindersQuery.error as Error).message
            : remindersQuery.isLoading
              ? "Loading reminders..."
              : "Reminders loaded.")}
      </p>
    </div>
  );
}
