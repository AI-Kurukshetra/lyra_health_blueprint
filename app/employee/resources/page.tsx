import { EmployeePageShell } from "@/components/employee/employee-page-shell";
import { ResourcesPanel } from "@/components/employee/resources-panel";
import { requireRole } from "@/lib/auth/session";

export default async function EmployeeResourcesPage() {
  await requireRole(["employee"]);

  return (
    <EmployeePageShell
      title="Resource Library"
      subtitle="Find curated tools, articles, and practical self-help resources by category."
    >
      <ResourcesPanel />
    </EmployeePageShell>
  );
}
