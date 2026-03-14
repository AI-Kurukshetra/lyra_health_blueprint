"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface NotificationRecord {
  id: string;
  title: string;
  body: string | null;
  user_id: string;
}

function showBrowserNotification(notification: NotificationRecord) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }
  if (Notification.permission === "granted") {
    new Notification(notification.title, {
      body: notification.body ?? undefined,
      tag: notification.id,
    });
  }
}

export function NotificationAgent() {
  const queryClient = useQueryClient();
  const seenIds = useRef<Set<string>>(new Set());
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;
    let intervalId: number | null = null;

    function handleNotification(notification: NotificationRecord) {
      if (seenIds.current.has(notification.id)) {
        return;
      }
      seenIds.current.add(notification.id);
      toast.info(notification.title, {
        description: notification.body ?? "",
      });
      showBrowserNotification(notification);
    }

    async function start() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) {
        return;
      }

      const realtimeChannel = supabase
        .channel(`notifications-live-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            handleNotification(payload.new as NotificationRecord);
            void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          },
        )
        .subscribe();

      const checkDueNotifications = async () => {
        const response = await fetch("/api/notifications/check-due", {
          method: "POST",
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json().catch(() => null)) as {
          data?: NotificationRecord[];
        };
        for (const entry of payload?.data ?? []) {
          handleNotification(entry);
        }
        if ((payload?.data ?? []).length > 0) {
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      };

      await checkDueNotifications();

      const handleVisibilityOrFocus = () => {
        if (document.visibilityState !== "hidden") {
          void checkDueNotifications();
        }
      };
      window.addEventListener("focus", handleVisibilityOrFocus);
      document.addEventListener("visibilitychange", handleVisibilityOrFocus);

      intervalId = window.setInterval(() => {
        void checkDueNotifications();
      }, 5_000);

      return () => {
        if (intervalId) {
          window.clearInterval(intervalId);
        }
        window.removeEventListener("focus", handleVisibilityOrFocus);
        document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
        void supabase.removeChannel(realtimeChannel);
      };
    }

    let cleanup: (() => void) | undefined;
    void start().then((stop) => {
      cleanup = stop;
    });

    return () => {
      active = false;
      cleanup?.();
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [queryClient, supabase]);

  return null;
}
