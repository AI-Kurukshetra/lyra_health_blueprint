import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function EmployerHomePage() {
  await requireRole(["employer_admin", "system_admin"]);
  redirect("/dashboard");
}
