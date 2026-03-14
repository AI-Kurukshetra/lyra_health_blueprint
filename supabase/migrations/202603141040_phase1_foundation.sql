create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('employee', 'provider', 'employer_admin', 'system_admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum ('scheduled', 'in_progress', 'completed', 'missed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'risk_level') then
    create type public.risk_level as enum ('low', 'medium', 'high', 'critical');
  end if;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  full_name text,
  role public.app_role not null default 'employee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  specialties text[] not null default '{}',
  languages text[] not null default '{}',
  timezone text not null default 'UTC',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  responses jsonb not null default '{}'::jsonb,
  risk_level public.risk_level not null default 'low',
  created_at timestamptz not null default now()
);

create table if not exists public.provider_availability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  availability_id uuid references public.provider_availability(id) on delete set null,
  status public.appointment_status not null default 'scheduled',
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 50,
  meeting_url text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  flagged_crisis boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.crisis_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  triggered_by uuid not null references public.profiles(id) on delete restrict,
  source text not null,
  severity public.risk_level not null default 'high',
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  details jsonb not null default '{}'::jsonb,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  mood_score integer not null check (mood_score between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  url text not null,
  is_global boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_providers_org on public.providers(organization_id);
create index if not exists idx_assessments_employee_created on public.assessments(employee_id, created_at desc);
create index if not exists idx_provider_availability_provider_time on public.provider_availability(provider_id, start_time);
create index if not exists idx_appointments_org_time on public.appointments(organization_id, scheduled_at);
create index if not exists idx_messages_sender_recipient_time on public.messages(sender_id, recipient_id, created_at desc);
create index if not exists idx_crisis_events_org_status on public.crisis_events(organization_id, status);
create index if not exists idx_mood_entries_employee_created on public.mood_entries(employee_id, created_at desc);
create index if not exists idx_audit_logs_org_created on public.audit_logs(organization_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_providers_updated_at on public.providers;
create trigger trg_providers_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

drop trigger if exists trg_session_notes_updated_at on public.session_notes;
create trigger trg_session_notes_updated_at
before update on public.session_notes
for each row execute function public.set_updated_at();

drop trigger if exists trg_goals_updated_at on public.goals;
create trigger trg_goals_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'system_admin', false);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'employee'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.providers enable row level security;
alter table public.assessments enable row level security;
alter table public.provider_availability enable row level security;
alter table public.appointments enable row level security;
alter table public.session_notes enable row level security;
alter table public.messages enable row level security;
alter table public.crisis_events enable row level security;
alter table public.mood_entries enable row level security;
alter table public.goals enable row level security;
alter table public.resources enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "organizations_read_same_org" on public.organizations;
create policy "organizations_read_same_org"
on public.organizations
for select
to authenticated
using (id = public.current_org_id() or public.is_system_admin());

drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin"
on public.organizations
for update
to authenticated
using ((id = public.current_org_id() and public.current_role() in ('employer_admin', 'system_admin')) or public.is_system_admin())
with check ((id = public.current_org_id() and public.current_role() in ('employer_admin', 'system_admin')) or public.is_system_admin());

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or (
    organization_id = public.current_org_id()
    and public.current_role() in ('provider', 'employer_admin', 'system_admin')
  )
  or public.is_system_admin()
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or (
    organization_id = public.current_org_id()
    and public.current_role() in ('employer_admin', 'system_admin')
  )
  or public.is_system_admin()
)
with check (
  id = auth.uid()
  or (
    organization_id = public.current_org_id()
    and public.current_role() in ('employer_admin', 'system_admin')
  )
  or public.is_system_admin()
);

drop policy if exists "providers_read_same_org" on public.providers;
create policy "providers_read_same_org"
on public.providers
for select
to authenticated
using (organization_id = public.current_org_id() or public.is_system_admin());

drop policy if exists "providers_manage_admin" on public.providers;
create policy "providers_manage_admin"
on public.providers
for all
to authenticated
using (
  (organization_id = public.current_org_id() and public.current_role() in ('employer_admin', 'system_admin'))
  or public.is_system_admin()
)
with check (
  (organization_id = public.current_org_id() and public.current_role() in ('employer_admin', 'system_admin'))
  or public.is_system_admin()
);

drop policy if exists "assessments_read_employee_or_clinical" on public.assessments;
create policy "assessments_read_employee_or_clinical"
on public.assessments
for select
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or public.current_role() in ('provider', 'employer_admin', 'system_admin')
  )
);

drop policy if exists "assessments_insert_employee" on public.assessments;
create policy "assessments_insert_employee"
on public.assessments
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and employee_id = auth.uid()
  and public.current_role() = 'employee'
);

drop policy if exists "provider_availability_read_same_org" on public.provider_availability;
create policy "provider_availability_read_same_org"
on public.provider_availability
for select
to authenticated
using (organization_id = public.current_org_id() or public.is_system_admin());

drop policy if exists "provider_availability_manage_provider_or_admin" on public.provider_availability;
create policy "provider_availability_manage_provider_or_admin"
on public.provider_availability
for all
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    provider_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
)
with check (
  organization_id = public.current_org_id()
  and (
    provider_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

drop policy if exists "appointments_select_participants_or_admin" on public.appointments;
create policy "appointments_select_participants_or_admin"
on public.appointments
for select
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or provider_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

drop policy if exists "appointments_insert_employee_or_admin" on public.appointments;
create policy "appointments_insert_employee_or_admin"
on public.appointments
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and (
    (employee_id = auth.uid() and public.current_role() = 'employee')
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

drop policy if exists "appointments_update_participants_or_admin" on public.appointments;
create policy "appointments_update_participants_or_admin"
on public.appointments
for update
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or provider_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
)
with check (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or provider_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

drop policy if exists "session_notes_select_participants" on public.session_notes;
create policy "session_notes_select_participants"
on public.session_notes
for select
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or provider_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

drop policy if exists "session_notes_insert_provider" on public.session_notes;
create policy "session_notes_insert_provider"
on public.session_notes
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and provider_id = auth.uid()
  and public.current_role() in ('provider', 'system_admin')
);

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages
for select
to authenticated
using (
  organization_id = public.current_org_id()
  and (sender_id = auth.uid() or recipient_id = auth.uid() or public.current_role() in ('employer_admin', 'system_admin'))
);

drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender"
on public.messages
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and sender_id = auth.uid()
);

drop policy if exists "crisis_events_select_clinical_admin" on public.crisis_events;
create policy "crisis_events_select_clinical_admin"
on public.crisis_events
for select
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or public.current_role() in ('provider', 'employer_admin', 'system_admin')
  )
);

drop policy if exists "crisis_events_insert_clinical" on public.crisis_events;
create policy "crisis_events_insert_clinical"
on public.crisis_events
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and public.current_role() in ('provider', 'employer_admin', 'system_admin')
);

drop policy if exists "crisis_events_update_clinical" on public.crisis_events;
create policy "crisis_events_update_clinical"
on public.crisis_events
for update
to authenticated
using (
  organization_id = public.current_org_id()
  and public.current_role() in ('provider', 'employer_admin', 'system_admin')
)
with check (
  organization_id = public.current_org_id()
  and public.current_role() in ('provider', 'employer_admin', 'system_admin')
);

drop policy if exists "mood_entries_select_self_or_clinical" on public.mood_entries;
create policy "mood_entries_select_self_or_clinical"
on public.mood_entries
for select
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or public.current_role() in ('provider', 'employer_admin', 'system_admin')
  )
);

drop policy if exists "mood_entries_insert_self" on public.mood_entries;
create policy "mood_entries_insert_self"
on public.mood_entries
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and employee_id = auth.uid()
);

drop policy if exists "goals_select_participants" on public.goals;
create policy "goals_select_participants"
on public.goals
for select
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or public.current_role() in ('provider', 'employer_admin', 'system_admin')
  )
);

drop policy if exists "goals_insert_employee_or_provider" on public.goals;
create policy "goals_insert_employee_or_provider"
on public.goals
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or public.current_role() in ('provider', 'system_admin')
  )
);

drop policy if exists "goals_update_participants" on public.goals;
create policy "goals_update_participants"
on public.goals
for update
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or public.current_role() in ('provider', 'system_admin')
  )
)
with check (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or public.current_role() in ('provider', 'system_admin')
  )
);

drop policy if exists "resources_read_org_or_global" on public.resources;
create policy "resources_read_org_or_global"
on public.resources
for select
to authenticated
using (
  is_global = true
  or organization_id = public.current_org_id()
  or public.is_system_admin()
);

drop policy if exists "resources_manage_admin" on public.resources;
create policy "resources_manage_admin"
on public.resources
for all
to authenticated
using (
  public.current_role() in ('employer_admin', 'system_admin')
  and (
    organization_id = public.current_org_id()
    or public.is_system_admin()
  )
)
with check (
  public.current_role() in ('employer_admin', 'system_admin')
  and (
    organization_id = public.current_org_id()
    or public.is_system_admin()
  )
);

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
on public.audit_logs
for select
to authenticated
using (
  public.current_role() in ('employer_admin', 'system_admin')
  and (
    organization_id = public.current_org_id()
    or public.is_system_admin()
  )
);

drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;
create policy "audit_logs_insert_authenticated"
on public.audit_logs
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and (
    organization_id = public.current_org_id()
    or public.is_system_admin()
    or organization_id is null
  )
);

