"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Clock9,
  ListFilter,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { addMinutes, formatInSystemTimeZone, getSystemTimeZone } from "@/lib/time/client";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  session_kind: "therapy" | "coaching";
  status: "scheduled" | "in_progress" | "completed" | "missed" | "cancelled";
  provider_id: string;
  meeting_url: string | null;
}

type AppointmentTab = "upcoming" | "history" | "all";

const tabLabels: Record<AppointmentTab, string> = {
  upcoming: "Upcoming",
  history: "History",
  all: "All",
};

const statusColors: Record<Appointment["status"], string> = {
  scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  missed: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-gray-200 bg-gray-100 text-gray-700",
};

export function EmployeeAppointmentsPanel() {
  const [activeTab, setActiveTab] = useState<AppointmentTab>("upcoming");
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const systemTimeZone = useMemo(() => getSystemTimeZone(), []);
  const appointmentsQuery = useQuery({
    queryKey: ["employee-appointments"],
    queryFn: async () => {
      const response = await fetch("/api/appointments");
      const payload = (await response.json().catch(() => null)) as {
        data?: Appointment[];
        error?: string;
      };
      if (!response.ok) {
        const message = payload?.error ?? "Failed to load appointments.";
        toast.error(message);
        throw new Error(message);
      }
      return payload.data ?? [];
    },
  });

  const appointments = appointmentsQuery.data;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const summary = useMemo(() => {
    let upcoming = 0;
    let therapy = 0;
    let coaching = 0;
    const providerIds = new Set<string>();

    for (const appointment of appointments ?? []) {
      providerIds.add(appointment.provider_id);
      const startsAt = new Date(appointment.scheduled_at).getTime();
      const endsAt = startsAt + appointment.duration_minutes * 60_000;
      const isUpcomingOrActive =
        (appointment.status === "scheduled" && endsAt >= currentTimestamp) || appointment.status === "in_progress";

      if (isUpcomingOrActive) {
        upcoming += 1;
      }
      if (appointment.session_kind === "coaching") {
        coaching += 1;
      } else {
        therapy += 1;
      }
    }

    return { upcoming, therapy, coaching, providers: providerIds.size };
  }, [appointments, currentTimestamp]);

  const filteredAppointments = useMemo(() => {
    if (activeTab === "all") return appointments ?? [];
    if (activeTab === "upcoming") {
      return (appointments ?? []).filter((appointment) => {
        const startsAt = new Date(appointment.scheduled_at).getTime();
        const endsAt = startsAt + appointment.duration_minutes * 60_000;
        return (
          (appointment.status === "scheduled" && endsAt >= currentTimestamp) ||
          appointment.status === "in_progress"
        );
      });
    }
    return (appointments ?? []).filter((appointment) => {
      const startsAt = new Date(appointment.scheduled_at).getTime();
      const endsAt = startsAt + appointment.duration_minutes * 60_000;
      const upcomingOrActive =
        (appointment.status === "scheduled" && endsAt >= currentTimestamp) ||
        appointment.status === "in_progress";
      return !upcomingOrActive;
    });
  }, [activeTab, appointments, currentTimestamp]);

  const status = appointmentsQuery.isLoading
    ? "Loading appointments..."
    : appointmentsQuery.error
      ? (appointmentsQuery.error as Error).message
      : (appointments ?? []).length > 0
        ? "Appointments loaded."
        : "No appointments yet.";

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Session Timeline
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900">Appointments</h2>
            <p className="mt-1 text-sm text-gray-600">
              View therapy and coaching sessions, then join your secure room directly.
            </p>
            <p className="mt-2 text-xs font-medium text-teal-700">All times shown in {systemTimeZone}</p>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            Active tab: <span className="font-semibold">{tabLabels[activeTab]}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Upcoming</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.upcoming}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Therapy</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.therapy}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Coaching</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.coaching}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Providers</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.providers}</p>
          </article>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3">
        <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
          <ListFilter className="h-3.5 w-3.5" />
          View filter
        </p>
        <div className="flex flex-wrap gap-2">
          {(["upcoming", "history", "all"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                activeTab === tab
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-gray-300 text-gray-700 hover:border-teal-300"
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      {appointmentsQuery.isLoading && (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-white/70" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filteredAppointments.map((appointment) => {
          const scheduledAt = new Date(appointment.scheduled_at);
          const endsAt = addMinutes(scheduledAt, appointment.duration_minutes);
          return (
            <article
              key={appointment.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatInSystemTimeZone(scheduledAt, { includeDate: true })}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">Provider ID: {appointment.provider_id}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusColors[appointment.status]}`}>
                    {appointment.status.replace("_", " ")}
                  </span>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold capitalize text-gray-700">
                    {appointment.session_kind}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1">
                  <Clock9 className="h-4 w-4 text-teal-600" />
                  {appointment.duration_minutes} minutes
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1">
                  <CalendarClock className="h-4 w-4 text-cyan-600" />
                  Starts {formatInSystemTimeZone(scheduledAt)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1">
                  <Timer className="h-4 w-4 text-indigo-600" />
                  Ends {formatInSystemTimeZone(endsAt, { includeDate: false })}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/provider/sessions/${appointment.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  Open session room
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {!appointmentsQuery.isLoading && filteredAppointments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="inline-flex items-center gap-1 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
            No appointments in this view yet.
          </p>
        </div>
      )}

      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">{status}</p>
    </div>
  );
}
