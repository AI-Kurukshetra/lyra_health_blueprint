"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatInSystemTimeZone } from "@/lib/time/client";

interface NotificationRecord {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationCenter() {
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      const payload = (await response.json().catch(() => null)) as {
        data?: NotificationRecord[];
        unreadCount?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load notifications.");
      }
      return {
        data: payload.data ?? [],
        unreadCount: payload.unreadCount ?? 0,
      };
    },
    refetchInterval: 20_000,
  });

  const notifications = notificationsQuery.data?.data;
  const { refetch } = notificationsQuery;
  const unreadCount = useMemo(
    () => (notifications ?? []).filter((entry) => !entry.read_at).length,
    [notifications],
  );

  function setLocalRead(ids?: string[]) {
    const nowIso = new Date().toISOString();
    queryClient.setQueryData<{ data: NotificationRecord[]; unreadCount: number } | undefined>(
      ["notifications"],
      (current) => {
        if (!current) {
          return current;
        }
        const nextData = current.data.map((entry) => {
          if (entry.read_at) {
            return entry;
          }
          if (!ids || ids.includes(entry.id)) {
            return { ...entry, read_at: nowIso };
          }
          return entry;
        });
        return {
          ...current,
          data: nextData,
          unreadCount: nextData.filter((entry) => !entry.read_at).length,
        };
      },
    );
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const checkDue = async () => {
      await fetch("/api/notifications/check-due", { method: "POST" });
      await refetch();
    };

    void checkDue();
  }, [open, refetch]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current) {
        return;
      }
      const target = event.target as Node | null;
      if (target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  async function markAllRead() {
    if (unreadCount === 0) {
      return;
    }
    setIsMarking(true);
    const response = await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      toast.error(payload?.error ?? "Failed to mark notifications as read.");
      setIsMarking(false);
      return;
    }

    setLocalRead();
    toast.success("Notifications marked as read.");
    setIsMarking(false);
    await refetch();
  }

  async function markOneRead(id: string) {
    setMarkingId(id);
    const response = await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      toast.error(payload?.error ?? "Failed to mark notification as read.");
      setMarkingId(null);
      return;
    }

    setLocalRead([id]);
    toast.success("Notification marked as read.");
    setMarkingId(null);
    await refetch();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-teal-200 hover:bg-teal-50"
      >
        <Bell className="h-4 w-4 text-teal-700" />
        Alerts
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-96 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button
              type="button"
              disabled={isMarking || unreadCount === 0}
              onClick={markAllRead}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {isMarking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              Mark all read
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {(notifications ?? []).map((entry) => (
              <article
                key={entry.id}
                className={`rounded-xl border p-3 ${
                  entry.read_at
                    ? "border-gray-200 bg-white"
                    : "border-teal-200 bg-teal-50/50"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{entry.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      entry.read_at
                        ? "border-gray-300 bg-gray-100 text-gray-600"
                        : "border-teal-200 bg-teal-100 text-teal-800"
                    }`}
                  >
                    {entry.read_at ? "Read" : "Unread"}
                  </span>
                  {!entry.read_at && (
                    <button
                      type="button"
                      onClick={() => markOneRead(entry.id)}
                      disabled={markingId === entry.id}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-700 hover:bg-gray-50"
                    >
                      {markingId === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Mark read
                    </button>
                  )}
                </div>
                {entry.body && <p className="mt-1 text-xs text-gray-700">{entry.body}</p>}
                <p className="mt-1 text-[11px] text-gray-500">{formatInSystemTimeZone(entry.created_at)}</p>
              </article>
            ))}

            {!notificationsQuery.isLoading && (notifications ?? []).length === 0 && (
              <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-600">
                No notifications yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
