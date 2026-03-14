import { notFound } from "next/navigation";
import { FeatureContent } from "@/components/features/feature-content";
import { RolePageShell } from "@/components/layout/role-page-shell";
import { requireRole } from "@/lib/auth/session";
import { getRoleFeatureRoute } from "@/lib/features/catalog";

interface AdminFeaturePageProps {
  params: Promise<{ feature: string }>;
}

export default async function AdminFeaturePage({ params }: AdminFeaturePageProps) {
  const session = await requireRole(["system_admin"]);
  const role = session.profile?.role ?? "system_admin";
  if (role !== "system_admin") {
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
