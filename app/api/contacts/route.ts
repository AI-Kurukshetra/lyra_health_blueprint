import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

export async function GET() {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const [profilesResult, messagesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("organization_id", profile.organization_id)
      .neq("id", profile.id)
      .order("full_name", { ascending: true }),
    supabase
      .from("messages")
      .select("sender_id, recipient_id, created_at")
      .eq("organization_id", profile.organization_id)
      .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (profilesResult.error || messagesResult.error) {
    return NextResponse.json(
      { error: profilesResult.error?.message ?? messagesResult.error?.message ?? "Failed to load contacts." },
      { status: 400 },
    );
  }

  const latestByPartner = new Map<string, string>();
  for (const message of messagesResult.data ?? []) {
    const partnerId = message.sender_id === profile.id ? message.recipient_id : message.sender_id;
    if (!latestByPartner.has(partnerId)) {
      latestByPartner.set(partnerId, message.created_at);
    }
  }

  const contacts = (profilesResult.data ?? [])
    .map((entry) => ({
      ...entry,
      last_message_at: latestByPartner.get(entry.id) ?? null,
    }))
    .sort((left, right) => {
      if (left.last_message_at && right.last_message_at) {
        return new Date(right.last_message_at).getTime() - new Date(left.last_message_at).getTime();
      }
      if (left.last_message_at) return -1;
      if (right.last_message_at) return 1;
      return (left.full_name ?? "").localeCompare(right.full_name ?? "");
    });

  return NextResponse.json({ data: contacts });
}
