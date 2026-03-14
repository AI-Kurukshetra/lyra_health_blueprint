import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/types/domain";

export interface GuardResult {
  userId: string;
  profile: Profile;
}

export async function requireApiRole(roles: AppRole[]): Promise<GuardResult | NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !roles.includes(profile.role as AppRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: user.id, profile: profile as Profile };
}

