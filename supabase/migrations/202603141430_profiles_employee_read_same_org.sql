drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or (
    organization_id = public.current_org_id()
    and public.current_role() in ('employee', 'provider', 'employer_admin', 'system_admin')
  )
  or public.is_system_admin()
);
