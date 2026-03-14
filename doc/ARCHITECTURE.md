# ARCHITECTURE

## Runtime
- Web app: `Next.js` App Router
- Data/Auth/Storage: `Supabase`
- Hosting target: `Vercel`

## Layered Design
- `app/`
  - Role-specific pages (`/employee`, `/provider`, `/employer`, `/admin`)
  - Route handlers under `app/api/*`
  - Auth callback and session-aware `proxy.ts`
- `components/`
  - Employee, provider, and employer UI modules
- `lib/`
  - Supabase clients (`server`, `client`, `middleware`)
  - Auth/session guards
  - Validation (Zod)
  - Matching algorithm
  - Security utilities (audit, rate limiting)
- `supabase/migrations/`
  - Schema, RLS, seeded resources, analytics view

## Request Flow
1. User authenticates with Supabase Auth.
2. Middleware refreshes/validates session.
3. Page guard verifies role and tenant context.
4. API handler validates payload (Zod), performs tenant-safe DB operation.
5. Sensitive mutations emit audit logs.

## Security Controls
- RLS enabled on tenant data tables.
- Role-aware policies for employee/provider/employer admin/system admin.
- API-level role checks via `requireProfileForApi`.
- Input validation before writes.
- Rate limiting on high-risk mutation endpoints.
- Employer views expose aggregated/anonymized metrics only.
