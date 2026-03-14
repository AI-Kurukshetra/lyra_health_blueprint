import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/types/domain";

export interface AuthSession {
  userId: string;
  email: string | null;
  profile: Profile | null;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as Profile | null) ?? null,
  };
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireRole(allowedRoles: AppRole[]): Promise<AuthSession> {
  const session = await requireAuth();
  const role = session.profile?.role;

  if (!role || !allowedRoles.includes(role)) {
    redirect("/dashboard");
  }

  return session;
}

