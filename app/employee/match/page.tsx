import { EmployeePageShell } from "@/components/employee/employee-page-shell";
import { MatchResults } from "@/components/employee/match-results";
import { requireRole } from "@/lib/auth/session";

export default async function EmployeeMatchPage() {
  await requireRole(["employee"]);

  return (
    <EmployeePageShell
      title="Therapist Matching"
      subtitle="Explore ranked provider recommendations and book a slot instantly."
    >
      <MatchResults />
    </EmployeePageShell>
  );
}
