import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

export async function GET() {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const [notificationsResult, unreadResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, kind, title, body, read_at, created_at")
      .eq("organization_id", profile.organization_id)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("user_id", profile.id)
      .is("read_at", null),
  ]);

  if (notificationsResult.error || unreadResult.error) {
    return NextResponse.json(
      { error: notificationsResult.error?.message ?? unreadResult.error?.message ?? "Failed to load notifications." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    data: notificationsResult.data ?? [],
    unreadCount: unreadResult.count ?? 0,
  });
}
