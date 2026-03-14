create or replace function public.default_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.organizations
  order by created_at asc
  limit 1;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, organization_id, full_name, role)
  values (
    new.id,
    public.default_organization_id(),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'employee'
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    organization_id = coalesce(public.profiles.organization_id, excluded.organization_id);

  return new;
end;
$$;

update public.profiles
set organization_id = public.default_organization_id()
where organization_id is null;

