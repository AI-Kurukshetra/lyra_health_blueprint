import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function EmployeeHomePage() {
  await requireRole(["employee"]);
  redirect("/dashboard");
}
