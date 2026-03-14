create or replace view public.employer_analytics_summary as
with assessment_counts as (
  select organization_id, count(*)::int as assessments_last_30_days
  from public.assessments
  where created_at >= now() - interval '30 days'
  group by organization_id
),
appointment_counts as (
  select
    organization_id,
    count(*)::int as total_appointments,
    count(*) filter (where status = 'completed' and created_at >= now() - interval '30 days')::int as completed_sessions_last_30_days
  from public.appointments
  group by organization_id
),
employee_counts as (
  select organization_id, count(*)::int as total_employees
  from public.profiles
  where role = 'employee'
  group by organization_id
),
provider_counts as (
  select organization_id, count(*)::int as total_providers
  from public.providers
  group by organization_id
)
select
  o.id as organization_id,
  coalesce(ec.total_employees, 0) as total_employees,
  coalesce(pc.total_providers, 0) as total_providers,
  coalesce(ac.assessments_last_30_days, 0) as assessments_last_30_days,
  coalesce(ap.total_appointments, 0) as total_appointments,
  coalesce(ap.completed_sessions_last_30_days, 0) as completed_sessions_last_30_days
from public.organizations o
left join employee_counts ec on ec.organization_id = o.id
left join provider_counts pc on pc.organization_id = o.id
left join assessment_counts ac on ac.organization_id = o.id
left join appointment_counts ap on ap.organization_id = o.id;

grant select on public.employer_analytics_summary to authenticated;

