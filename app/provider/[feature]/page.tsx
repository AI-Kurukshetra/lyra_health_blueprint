import { notFound } from "next/navigation";
import { FeatureContent } from "@/components/features/feature-content";
import { RolePageShell } from "@/components/layout/role-page-shell";
import { requireRole } from "@/lib/auth/session";
import { getRoleFeatureRoute } from "@/lib/features/catalog";

interface ProviderFeaturePageProps {
  params: Promise<{ feature: string }>;
}

export default async function ProviderFeaturePage({ params }: ProviderFeaturePageProps) {
  const session = await requireRole(["provider"]);
  const role = session.profile?.role ?? "provider";
  if (role !== "provider") {
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
