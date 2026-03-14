import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/domain";

export interface CurrentProfile {
  id: string;
  organization_id: string | null;
  role: AppRole;
  full_name: string | null;
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return profile as CurrentProfile;
}

export async function requireProfileForApi(
  roles?: AppRole[],
): Promise<CurrentProfile | NextResponse> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!profile.organization_id && profile.role !== "system_admin") {
    return NextResponse.json({ error: "User is not assigned to an organization." }, { status: 403 });
  }
  if (roles && !roles.includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return profile;
}

