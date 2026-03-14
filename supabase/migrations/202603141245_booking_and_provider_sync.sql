create or replace function public.sync_provider_record_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'provider' and new.organization_id is not null then
    insert into public.providers (id, organization_id)
    values (new.id, new.organization_id)
    on conflict (id) do update
    set organization_id = excluded.organization_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_sync_provider on public.profiles;
create trigger trg_profiles_sync_provider
after insert or update of role, organization_id on public.profiles
for each row
execute function public.sync_provider_record_from_profile();

insert into public.providers (id, organization_id)
select p.id, p.organization_id
from public.profiles p
where p.role = 'provider'
  and p.organization_id is not null
on conflict (id) do update
set organization_id = excluded.organization_id;

create unique index if not exists idx_appointments_one_active_per_availability
on public.appointments(availability_id)
where availability_id is not null
  and status in ('scheduled', 'in_progress', 'completed', 'missed');

create or replace function public.book_appointment(
  p_provider_id uuid,
  p_availability_id uuid
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

revoke all on function public.book_appointment(uuid, uuid) from public;
grant execute on function public.book_appointment(uuid, uuid) to authenticated;
