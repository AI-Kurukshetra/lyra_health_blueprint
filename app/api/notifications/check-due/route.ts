import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

interface ReminderRow {
  id: string;
  reminder_type: "appointment" | "medication" | "wellness";
  title: string;
  details: string | null;
  remind_at: string;
  notified_at: string | null;
  repeat_interval_minutes: number | null;
}

function notificationCopy(reminder: ReminderRow) {
  if (reminder.reminder_type === "appointment") {
    return {
      title: `Appointment reminder: ${reminder.title}`,
      body: reminder.details ?? "You have a scheduled care appointment reminder.",
    };
  }
  if (reminder.reminder_type === "medication") {
    return {
      title: `Medication reminder: ${reminder.title}`,
      body: reminder.details ?? "Time to take your medication.",
    };
  }
  return {
    title: `Wellness reminder: ${reminder.title}`,
    body: reminder.details ?? "Time for your planned wellness activity.",
  };
}

export async function POST() {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: dueReminders, error: dueError } = await supabase
    .from("automated_reminders")
    .select("id, reminder_type, title, details, remind_at, notified_at, repeat_interval_minutes")
    .eq("organization_id", profile.organization_id)
    .eq("user_id", profile.id)
    .eq("status", "active")
    .lte("remind_at", nowIso)
    .order("remind_at", { ascending: true })
    .limit(50);

  if (dueError) {
    return NextResponse.json({ error: dueError.message }, { status: 400 });
  }

  const reminders = ((dueReminders ?? []) as ReminderRow[]).filter((reminder) => {
    if (!reminder.notified_at) {
      return true;
    }
    return new Date(reminder.notified_at).getTime() < new Date(reminder.remind_at).getTime();
  });
  const createdNotifications: Array<Record<string, unknown>> = [];

  for (const reminder of reminders) {
    const copy = notificationCopy(reminder);
    const notificationInsert = await supabase
      .from("notifications")
      .insert(
        {
          organization_id: profile.organization_id,
          user_id: profile.id,
          kind: `reminder:${reminder.reminder_type}`,
          title: copy.title,
          body: copy.body,
          payload: {
            reminderType: reminder.reminder_type,
            reminderId: reminder.id,
          },
          source_reminder_id: reminder.id,
          source_reminder_at: reminder.remind_at,
        },
      )
      .select("id, title, body, user_id, created_at")
      .maybeSingle();

    if (notificationInsert.error) {
      if ((notificationInsert.error as { code?: string }).code === "23505") {
        continue;
      }
      continue;
    }

    if (notificationInsert.data) {
      createdNotifications.push(notificationInsert.data);
    }

    if (reminder.repeat_interval_minutes) {
      const nextAt = new Date(
        new Date(reminder.remind_at).getTime() + reminder.repeat_interval_minutes * 60_000,
      ).toISOString();
      await supabase
        .from("automated_reminders")
        .update({
          remind_at: nextAt,
          notified_at: nowIso,
        })
        .eq("id", reminder.id)
        .eq("organization_id", profile.organization_id)
        .eq("user_id", profile.id);
    } else {
      await supabase
        .from("automated_reminders")
        .update({
          status: "completed",
          notified_at: nowIso,
        })
        .eq("id", reminder.id)
        .eq("organization_id", profile.organization_id)
        .eq("user_id", profile.id);
    }
  }

  if (createdNotifications.length > 0) {
    await createAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "notification.reminder.dispatched",
      entity: "notification",
      metadata: { count: createdNotifications.length },
    });
  }

  return NextResponse.json({ data: createdNotifications });
}
