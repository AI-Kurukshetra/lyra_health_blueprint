import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function ProviderHomePage() {
  await requireRole(["provider"]);
  redirect("/dashboard");
}
