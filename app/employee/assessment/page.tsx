import { AssessmentForm } from "@/components/employee/assessment-form";
import { EmployeePageShell } from "@/components/employee/employee-page-shell";
import { requireRole } from "@/lib/auth/session";

export default async function EmployeeAssessmentPage() {
  await requireRole(["employee"]);

  return (
    <EmployeePageShell
      title="Self-assessment"
      subtitle="Capture your current mental health context to improve provider match quality."
    >
      <AssessmentForm />
    </EmployeePageShell>
  );
}
