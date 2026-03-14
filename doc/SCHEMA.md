# SCHEMA

## Enums
- `app_role`: `employee`, `provider`, `employer_admin`, `system_admin`
- `appointment_status`: `scheduled`, `in_progress`, `completed`, `missed`, `cancelled`
- `risk_level`: `low`, `medium`, `high`, `critical`

## Core Tables
- `organizations`
- `profiles`
- `providers`
- `assessments`
- `provider_availability`
- `appointments`
- `session_notes`
- `messages`
- `crisis_events`
- `mood_entries`
- `goals`
- `resources`
- `audit_logs`

## Views
- `employer_analytics_summary`

## Security Model
- All tenant-scoped records include `organization_id`.
- Access is controlled with Supabase RLS policies per table.
- Helper functions:
  - `current_role()`
  - `current_org_id()`
  - `is_system_admin()`
- Profile auto-provision trigger:
  - `handle_new_user()` on `auth.users`.
  - `default_organization_id()` ensures new users are assigned to a default organization when available.

## Operational Features
- `set_updated_at()` trigger used on mutable tables.
- Indexes added for core query paths:
  - assessments, availability, appointments, messages, crisis events, moods, audit logs.
