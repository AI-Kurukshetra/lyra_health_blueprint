import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function AdminPage() {
  await requireRole(["system_admin"]);
  redirect("/dashboard");
}
