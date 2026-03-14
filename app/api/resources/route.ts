import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

export async function GET(request: Request) {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const supabase = await createClient();
  let query = supabase
    .from("resources")
    .select("*")
    .or(`is_global.eq.true,organization_id.eq.${profile.organization_id}`)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

