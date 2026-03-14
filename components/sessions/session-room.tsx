"use client";

import { useEffect, useMemo, useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import {
  Camera,
  Clock3,
  Loader2,
  Mic,
  PlayCircle,
  Shield,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import {
  addMinutes,
  formatInSystemTimeZone,
  getSystemTimeZone,
} from "@/lib/time/client";

type SessionStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "missed"
  | "cancelled";
type SessionKind = "therapy" | "coaching";
type SessionRole = "employee" | "provider" | "system_admin";

interface SessionRoomProps {
  appointmentId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  sessionKind: SessionKind;
  role: SessionRole;
  providerLabel: string;
  employeeLabel: string;
}

function buildJitsiRoomName(appointmentId: string, sessionKind: SessionKind) {
  return `lyra-${sessionKind}-${appointmentId}`;
}

export function SessionRoom({
  appointmentId,
  scheduledAt,
  durationMinutes,
  status,
  sessionKind,
  role,
  providerLabel,
  employeeLabel,
}: SessionRoomProps) {
  const [joined, setJoined] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<SessionStatus>(status);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const systemTimeZone = useMemo(() => getSystemTimeZone(), []);
  const sessionStart = new Date(scheduledAt);
  const sessionEnd = addMinutes(sessionStart, durationMinutes);
  const joinOpensAt = new Date(sessionStart.getTime() - 5 * 60_000);
  const hasJoinWindowStarted = currentTimestamp >= joinOpensAt.getTime();
  const joinAllowedByStatus =
    currentStatus === "scheduled" || currentStatus === "in_progress";
  const canStart = hasJoinWindowStarted && joinAllowedByStatus;
  const minutesUntilJoin = Math.max(
    0,
    Math.ceil((joinOpensAt.getTime() - currentTimestamp) / 60_000),
  );
  const joinStateMessage = !joinAllowedByStatus
    ? `Session is ${currentStatus.replace("_", " ")}. Joining is unavailable.`
    : canStart
      ? "You can now join this session."
      : `Room opens in ${minutesUntilJoin} minute${minutesUntilJoin === 1 ? "" : "s"} (5 minutes before start).`;
  const jitsiRoom = useMemo(
    () => buildJitsiRoomName(appointmentId, sessionKind),
    [appointmentId, sessionKind],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  async function updateStatus(nextStatus: SessionStatus) {
    setStatusMessage("Updating session status...");
    setStatusUpdating(true);
    const response = await fetch(
      `/api/provider/appointments/${appointmentId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      },
    );
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    };

    if (!response.ok) {
      const message = payload?.error ?? "Failed to update session status.";
      setStatusMessage(message);
      toast.error(message);
      setStatusUpdating(false);
      return;
    }

    setCurrentStatus(nextStatus);
    setStatusMessage(`Session marked as ${nextStatus.replace("_", " ")}.`);
    toast.success(`Session marked as ${nextStatus.replace("_", " ")}.`);
    setStatusUpdating(false);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              {sessionKind === "therapy"
                ? "Video Therapy Session"
                : "Mental Health Coaching Session"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">
              {sessionKind === "therapy"
                ? "Secure Therapy Room"
                : "Secure Coaching Room"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Provider: {providerLabel} | Participant: {employeeLabel}
            </p>
            <p className="mt-2 text-xs font-medium text-teal-700">
              All times shown in {systemTimeZone}
            </p>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            Status:{" "}
            <span className="font-semibold">
              {currentStatus.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <p className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            <Clock3 className="h-4 w-4 text-teal-600" />
            Starts {formatInSystemTimeZone(sessionStart)}
          </p>
          <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            Duration: {durationMinutes} minutes
          </p>
          <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            Expected end:{" "}
            {formatInSystemTimeZone(sessionEnd, { includeDate: false })}
          </p>
        </div>
        <div className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
          Join window opens at{" "}
          {formatInSystemTimeZone(joinOpensAt, { includeDate: false })}.
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {!joined ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAudioEnabled((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${
                  audioEnabled
                    ? "border-teal-200 bg-teal-50 text-teal-700"
                    : "border-gray-300 bg-gray-50 text-gray-600"
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
                Audio {audioEnabled ? "on" : "off"}
              </button>
              <button
                type="button"
                onClick={() => setVideoEnabled((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${
                  videoEnabled
                    ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                    : "border-gray-300 bg-gray-50 text-gray-600"
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                Video {videoEnabled ? "on" : "off"}
              </button>
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-gray-600">
                <Shield className="h-3.5 w-3.5" />
                Auth-gated access
              </span>
            </div>
            <p className="text-sm text-gray-600">{joinStateMessage}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!canStart}
                onClick={() => {
                  setJoined(true);
                  setStatusMessage(null);
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  canStart
                    ? "bg-gradient-to-r from-teal-600 to-cyan-500 text-white"
                    : "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-500"
                }`}
              >
                <PlayCircle className="h-4 w-4" />
                {canStart ? "Join secure video room" : "Room opens shortly"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <JitsiMeeting
                domain="meet.jit.si"
                roomName={jitsiRoom}
                configOverwrite={{
                  prejoinPageEnabled: false,
                  startWithAudioMuted: !audioEnabled,
                  startWithVideoMuted: !videoEnabled,
                }}
                interfaceConfigOverwrite={{
                  DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                }}
                userInfo={{
                  displayName:
                    role === "provider"
                      ? providerLabel
                      : role === "employee"
                        ? employeeLabel
                        : "Lyra Admin",
                  email: "session.room@horizonwellness.com",
                }}
                getIFrameRef={(iframeRef) => {
                  iframeRef.style.height = "540px";
                  iframeRef.style.width = "100%";
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {role !== "employee" && (
                <>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => updateStatus("in_progress")}
                    className={`rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100 ${statusUpdating ? "is-loading opacity-80" : ""}`}
                  >
                    {statusUpdating ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      "Mark in progress"
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => updateStatus("completed")}
                    className={`inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 ${statusUpdating ? "is-loading opacity-80" : ""}`}
                  >
                    {statusUpdating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                    {statusUpdating ? "Updating..." : "End session"}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setJoined(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Leave room
              </button>
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          {statusMessage}
        </p>
      )}
    </div>
  );
}
