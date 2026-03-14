import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "id,created_at,actor_id,action,entity,entity_id,metadata\n";

  const headers = ["id", "created_at", "actor_id", "action", "entity", "entity_id", "metadata"];
  const csvRows = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        const normalized =
          typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
        return `"${normalized.replaceAll('"', '""')}"`;
      })
      .join(","),
  );

  return `${headers.join(",")}\n${csvRows.join("\n")}\n`;
}

export async function GET() {
  const profile = await requireProfileForApi(["employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, created_at, actor_id, action, entity, entity_id, metadata")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const csv = toCsv((data ?? []) as Record<string, unknown>[]);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

