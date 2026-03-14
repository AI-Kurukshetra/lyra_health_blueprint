"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Timer } from "lucide-react";
import { toast } from "sonner";
import { addMinutes, formatInSystemTimeZone, getSystemTimeZone } from "@/lib/time/client";

interface Appointment {
  id: string;
  employee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  session_kind: "therapy" | "coaching";
  status: "scheduled" | "in_progress" | "completed" | "missed" | "cancelled";
  meeting_url: string | null;
}

const statusOptions: Appointment["status"][] = [
  "scheduled",
  "in_progress",
  "completed",
  "missed",
  "cancelled",
];

export function ProviderAppointmentsPanel() {
  const systemTimeZone = useMemo(() => getSystemTimeZone(), []);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [noteSavingId, setNoteSavingId] = useState<string | null>(null);
  const appointmentsQuery = useQuery({
    queryKey: ["provider-appointments"],
    queryFn: async () => {
      const response = await fetch("/api/appointments");
      const payload = (await response.json().catch(() => null)) as {
        data?: Appointment[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load appointments.");
      }
      return payload.data ?? [];
    },
  });

  const appointments = appointmentsQuery.data ?? [];

  async function updateStatus(appointmentId: string, status: Appointment["status"]) {
    setStatusMessage("Updating appointment status...");
    setStatusUpdatingId(appointmentId);
    const response = await fetch(`/api/provider/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };
    if (!response.ok) {
      const message = payload?.error ?? "Failed to update status.";
      setStatusMessage(message);
      toast.error(message);
      setStatusUpdatingId(null);
      return;
    }
    setStatusMessage("Appointment status updated.");
    toast.success(`Appointment marked as ${status.replace("_", " ")}.`);
    setStatusUpdatingId(null);
    await appointmentsQuery.refetch();
  }

  async function saveSessionNote(appointmentId: string, employeeId: string) {
    const note = noteDrafts[appointmentId]?.trim();
    if (!note) {
      setStatusMessage("Session note cannot be empty.");
      toast.error("Session note cannot be empty.");
      return;
    }

    setStatusMessage("Saving session note...");
    setNoteSavingId(appointmentId);
    const response = await fetch("/api/session-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId,
        employeeId,
        note,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };
    if (!response.ok) {
      const message = payload?.error ?? "Failed to save session note.";
      setStatusMessage(message);
      toast.error(message);
      setNoteSavingId(null);
      return;
    }

    setNoteDrafts((prev) => ({ ...prev, [appointmentId]: "" }));
    setStatusMessage("Session note saved.");
    toast.success("Session note saved successfully.");
    setNoteSavingId(null);
  }

  const status = statusMessage
    ? statusMessage
    : appointmentsQuery.isLoading
      ? "Loading appointments..."
      : appointmentsQuery.error
        ? (appointmentsQuery.error as Error).message
        : "Appointments loaded.";

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
        All appointment times are shown in {systemTimeZone}.
      </p>
      {appointments.map((appointment) => (
        <article key={appointment.id} className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-base font-semibold text-gray-900">
            {formatInSystemTimeZone(appointment.scheduled_at)}
          </h3>
          <p className="mt-1 text-sm text-gray-600">Employee ID: {appointment.employee_id}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
            <Timer className="h-3.5 w-3.5 text-indigo-600" />
            Ends{" "}
            {formatInSystemTimeZone(
              addMinutes(new Date(appointment.scheduled_at), appointment.duration_minutes),
              { includeDate: false },
            )}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
            {appointment.session_kind === "coaching" ? "Coaching session" : "Therapy session"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {statusOptions.map((option) => (
              <button
                key={option}
                type="button"
                disabled={statusUpdatingId === appointment.id}
                onClick={() => updateStatus(appointment.id, option)}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  appointment.status === option
                    ? "border-teal-700 bg-teal-50 text-teal-800"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                {statusUpdatingId === appointment.id ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating
                  </span>
                ) : (
                  option
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/provider/sessions/${appointment.id}`}
              className="inline-block rounded-md bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Open session room
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            <textarea
              value={noteDrafts[appointment.id] ?? ""}
              onChange={(event) =>
                setNoteDrafts((prev) => ({ ...prev, [appointment.id]: event.target.value }))
              }
              className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Session note"
            />
            <button
              type="button"
              disabled={noteSavingId === appointment.id}
              onClick={() => saveSessionNote(appointment.id, appointment.employee_id)}
              className={`rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 ${noteSavingId === appointment.id ? "is-loading opacity-80" : ""}`}
            >
              {noteSavingId === appointment.id ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save note"
              )}
            </button>
          </div>
        </article>
      ))}

      <p className="text-sm text-gray-700">{status}</p>
    </div>
  );
}
