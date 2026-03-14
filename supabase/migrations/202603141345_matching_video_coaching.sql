do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'care_modalities'
  ) then
    alter table public.providers
      add column care_modalities text[] not null default array['video'];
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'coaching_focus_areas'
  ) then
    alter table public.providers
      add column coaching_focus_areas text[] not null default '{}';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'cultural_specialties'
  ) then
    alter table public.providers
      add column cultural_specialties text[] not null default '{}';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'provider_style'
  ) then
    alter table public.providers
      add column provider_style text;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'gender_identity'
  ) then
    alter table public.providers
      add column gender_identity text;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'years_experience'
  ) then
    alter table public.providers
      add column years_experience integer check (years_experience >= 0);
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'accepts_coaching'
  ) then
    alter table public.providers
      add column accepts_coaching boolean not null default false;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'provider_availability'
      and column_name = 'session_kind'
  ) then
    alter table public.provider_availability
      add column session_kind text not null default 'therapy'
      check (session_kind in ('therapy', 'coaching'));
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'session_kind'
  ) then
    alter table public.appointments
      add column session_kind text not null default 'therapy'
      check (session_kind in ('therapy', 'coaching'));
  end if;
end $$;

create index if not exists idx_provider_availability_kind_time
on public.provider_availability(organization_id, session_kind, start_time)
where is_booked = false;

create index if not exists idx_appointments_session_kind_time
on public.appointments(organization_id, session_kind, scheduled_at);

create table if not exists public.coaching_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.providers(id) on delete set null,
  focus_areas text[] not null default '{}',
  goals text not null,
  preferred_frequency text not null default 'weekly' check (preferred_frequency in ('weekly', 'biweekly', 'monthly')),
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coaching_plans_employee_updated
on public.coaching_plans(employee_id, updated_at desc);

drop trigger if exists trg_coaching_plans_updated_at on public.coaching_plans;
create trigger trg_coaching_plans_updated_at
before update on public.coaching_plans
for each row execute function public.set_updated_at();

alter table public.coaching_plans enable row level security;

drop policy if exists "coaching_plans_select_participants" on public.coaching_plans;
create policy "coaching_plans_select_participants"
on public.coaching_plans
for select
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or coach_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

drop policy if exists "coaching_plans_insert_employee" on public.coaching_plans;
create policy "coaching_plans_insert_employee"
on public.coaching_plans
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and employee_id = auth.uid()
  and public.current_role() = 'employee'
);

drop policy if exists "coaching_plans_update_participants" on public.coaching_plans;
create policy "coaching_plans_update_participants"
on public.coaching_plans
for update
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or coach_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
)
with check (
  organization_id = public.current_org_id()
  and (
    employee_id = auth.uid()
    or coach_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

create or replace function public.book_appointment(
  p_provider_id uuid,
  p_availability_id uuid,
  p_session_kind text default 'therapy'
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_profile public.profiles%rowtype;
  v_slot public.provider_availability%rowtype;
  v_appointment public.appointments%rowtype;
  v_duration_minutes integer;
begin
  v_actor_id := auth.uid();
  if v_actor_id is null then
    raise exception 'Unauthorized';
  end if;

  if p_session_kind not in ('therapy', 'coaching') then
    raise exception 'Invalid session kind.';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_actor_id;

  if not found then
    raise exception 'Unauthorized';
  end if;

  if v_profile.organization_id is null then
    raise exception 'User is not assigned to an organization.';
  end if;

  if v_profile.role <> 'employee' then
    raise exception 'Forbidden';
  end if;

  select *
  into v_slot
  from public.provider_availability
  where id = p_availability_id
    and provider_id = p_provider_id
    and organization_id = v_profile.organization_id
    and session_kind = p_session_kind
    and is_booked = false
    and start_time >= now()
  for update;

  if not found then
    raise exception 'Availability slot no longer available.';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.availability_id = v_slot.id
      and a.status in ('scheduled', 'in_progress', 'completed', 'missed')
  ) then
    raise exception 'Availability slot is already booked.';
  end if;

  update public.provider_availability
  set is_booked = true
  where id = v_slot.id
    and is_booked = false;

  if not found then
    raise exception 'Availability slot no longer available.';
  end if;

  v_duration_minutes := greatest(
    15,
    round(extract(epoch from (v_slot.end_time - v_slot.start_time)) / 60)::integer
  );

  insert into public.appointments (
    organization_id,
    employee_id,
    provider_id,
    availability_id,
    session_kind,
    status,
    scheduled_at,
    duration_minutes,
    created_by
  )
  values (
    v_profile.organization_id,
    v_actor_id,
    p_provider_id,
    v_slot.id,
    p_session_kind,
    'scheduled',
    v_slot.start_time,
    v_duration_minutes,
    v_actor_id
  )
  returning *
  into v_appointment;

  update public.appointments
  set meeting_url = '/provider/sessions/' || v_appointment.id::text
  where id = v_appointment.id
  returning *
  into v_appointment;

  return v_appointment;
end;
$$;

revoke all on function public.book_appointment(uuid, uuid, text) from public;
grant execute on function public.book_appointment(uuid, uuid, text) to authenticated;
