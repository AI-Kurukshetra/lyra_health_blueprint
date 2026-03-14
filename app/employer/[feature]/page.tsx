import { notFound } from "next/navigation";
import { FeatureContent } from "@/components/features/feature-content";
import { RolePageShell } from "@/components/layout/role-page-shell";
import { requireRole } from "@/lib/auth/session";
import { getRoleFeatureRoute } from "@/lib/features/catalog";

interface EmployerFeaturePageProps {
  params: Promise<{ feature: string }>;
}

export default async function EmployerFeaturePage({ params }: EmployerFeaturePageProps) {
  const session = await requireRole(["employer_admin"]);
  const role = session.profile?.role ?? "employer_admin";
  if (role !== "employer_admin") {
    notFound();
  }

  const { feature } = await params;
  const route = getRoleFeatureRoute(role, feature);

  if (!route) {
    notFound();
  }

  return (
    <RolePageShell title={route.title} subtitle={route.subtitle} roleLabel={route.roleLabel}>
      <FeatureContent content={route.content} />
    </RolePageShell>
  );
}
