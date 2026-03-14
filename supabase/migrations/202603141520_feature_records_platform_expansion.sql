create table if not exists public.feature_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  feature_key text not null,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  starts_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_feature_records_org_key_created
on public.feature_records(organization_id, feature_key, created_at desc);

create index if not exists idx_feature_records_actor_created
on public.feature_records(actor_id, created_at desc);

drop trigger if exists trg_feature_records_updated_at on public.feature_records;
create trigger trg_feature_records_updated_at
before update on public.feature_records
for each row execute function public.set_updated_at();

alter table public.feature_records enable row level security;

drop policy if exists "feature_records_select_same_org" on public.feature_records;
create policy "feature_records_select_same_org"
on public.feature_records
for select
to authenticated
using (
  organization_id = public.current_org_id()
  or public.is_system_admin()
);

drop policy if exists "feature_records_insert_same_org" on public.feature_records;
create policy "feature_records_insert_same_org"
on public.feature_records
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and actor_id = auth.uid()
);

drop policy if exists "feature_records_update_owner_or_admin" on public.feature_records;
create policy "feature_records_update_owner_or_admin"
on public.feature_records
for update
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    actor_id = auth.uid()
    or public.current_role() in ('provider', 'employer_admin', 'system_admin')
  )
)
with check (
  organization_id = public.current_org_id()
  and (
    actor_id = auth.uid()
    or public.current_role() in ('provider', 'employer_admin', 'system_admin')
  )
);
