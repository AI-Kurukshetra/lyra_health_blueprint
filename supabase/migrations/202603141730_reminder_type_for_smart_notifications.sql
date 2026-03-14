alter table public.automated_reminders
add column if not exists reminder_type text;

update public.automated_reminders
set reminder_type = 'wellness'
where reminder_type is null;

alter table public.automated_reminders
alter column reminder_type set default 'wellness';

alter table public.automated_reminders
alter column reminder_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'automated_reminders_reminder_type_check'
      and conrelid = 'public.automated_reminders'::regclass
  ) then
    alter table public.automated_reminders
    add constraint automated_reminders_reminder_type_check
    check (reminder_type in ('appointment', 'medication', 'wellness'));
  end if;
end $$;

create index if not exists idx_automated_reminders_user_type_due
on public.automated_reminders(user_id, reminder_type, remind_at asc);
