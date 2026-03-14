import { notFound } from "next/navigation";
import { FeatureContent } from "@/components/features/feature-content";
import { RolePageShell } from "@/components/layout/role-page-shell";
import { requireRole } from "@/lib/auth/session";
import { getRoleFeatureRoute } from "@/lib/features/catalog";

interface EmployeeFeaturePageProps {
  params: Promise<{ feature: string }>;
}

export default async function EmployeeFeaturePage({ params }: EmployeeFeaturePageProps) {
  const session = await requireRole(["employee"]);
  const { feature } = await params;
  const route = getRoleFeatureRoute(session.profile?.role ?? "employee", feature);

  if (!route) {
    notFound();
  }

  return (
    <RolePageShell title={route.title} subtitle={route.subtitle} roleLabel={route.roleLabel}>
      <FeatureContent content={route.content} />
    </RolePageShell>
  );
}
