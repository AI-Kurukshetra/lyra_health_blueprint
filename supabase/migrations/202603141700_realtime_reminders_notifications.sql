create table if not exists public.automated_reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  details text,
  remind_at timestamptz not null,
  repeat_interval_minutes integer check (repeat_interval_minutes is null or repeat_interval_minutes > 0),
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_automated_reminders_user_due
on public.automated_reminders(user_id, remind_at asc);

create index if not exists idx_automated_reminders_org_status_due
on public.automated_reminders(organization_id, status, remind_at asc);

drop trigger if exists trg_automated_reminders_updated_at on public.automated_reminders;
create trigger trg_automated_reminders_updated_at
before update on public.automated_reminders
for each row execute function public.set_updated_at();

alter table public.automated_reminders enable row level security;

drop policy if exists "automated_reminders_select" on public.automated_reminders;
create policy "automated_reminders_select"
on public.automated_reminders
for select
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    user_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

drop policy if exists "automated_reminders_insert_self" on public.automated_reminders;
create policy "automated_reminders_insert_self"
on public.automated_reminders
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and user_id = auth.uid()
);

drop policy if exists "automated_reminders_update" on public.automated_reminders;
create policy "automated_reminders_update"
on public.automated_reminders
for update
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    user_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
)
with check (
  organization_id = public.current_org_id()
  and (
    user_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

drop policy if exists "automated_reminders_delete" on public.automated_reminders;
create policy "automated_reminders_delete"
on public.automated_reminders
for delete
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    user_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  payload jsonb not null default '{}'::jsonb,
  source_reminder_id uuid references public.automated_reminders(id) on delete set null,
  source_reminder_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_unread
on public.notifications(user_id, read_at)
where read_at is null;

create unique index if not exists uq_notifications_reminder_due
on public.notifications(source_reminder_id, source_reminder_at)
where source_reminder_id is not null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select"
on public.notifications
for select
to authenticated
using (
  organization_id = public.current_org_id()
  and (
    user_id = auth.uid()
    or public.current_role() in ('employer_admin', 'system_admin')
  )
);

drop policy if exists "notifications_insert_self" on public.notifications;
create policy "notifications_insert_self"
on public.notifications
for insert
to authenticated
with check (
  organization_id = public.current_org_id()
  and user_id = auth.uid()
);

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self"
on public.notifications
for update
to authenticated
using (
  organization_id = public.current_org_id()
  and user_id = auth.uid()
)
with check (
  organization_id = public.current_org_id()
  and user_id = auth.uid()
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'automated_reminders'
  ) then
    alter publication supabase_realtime add table public.automated_reminders;
  end if;
end $$;
