alter table public.automated_reminders
add column if not exists timezone text;

update public.automated_reminders
set timezone = 'UTC'
where timezone is null;

alter table public.automated_reminders
alter column timezone set default 'UTC';

alter table public.automated_reminders
alter column timezone set not null;

create index if not exists idx_automated_reminders_user_timezone_due
on public.automated_reminders(user_id, timezone, remind_at asc);
