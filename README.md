# Lyra Health Platform

Enterprise mental wellness platform MVP built with:
- Next.js (App Router, TypeScript)
- Supabase (Postgres, Auth, RLS)
- Vercel (deployment target)

## Prerequisites
- Node.js `v24.8.0` (required by Next.js 16)
- pnpm
- Supabase project credentials

Use `.nvmrc` for local version alignment:
```bash
nvm use
```

## Setup
```bash
cp .env.example .env.local
pnpm install
pnpm db:bootstrap
pnpm dev
```

## Supabase Bootstrap Flow
1. In `.env.local`, set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (Supabase Postgres URI)
2. Run:
```bash
pnpm db:bootstrap
```
This will:
- apply all SQL migrations from `supabase/migrations`
- create a demo organization
- create and seed test users/roles
- seed provider profile and availability slots

## Core Commands
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Project Layout
- `app/`: routes, pages, and API handlers
- `components/`: role-specific and shared UI
- `lib/`: auth, Supabase clients, validation, matching, security helpers
- `supabase/migrations/`: schema, RLS, and analytics SQL
- `tests/`: unit and e2e tests
- `doc/`: PRD, architecture, schema, tasks, and progress logs

## Implemented Workstreams
- Authentication and role-based routing
- Multi-tenant schema with RLS policies
- Employee workflows: assessment, matching, appointments, progress, resources
- Provider workflows: availability, appointment status, notes, messaging, crisis queue
- Employer workflows: anonymized analytics and compliance CSV export
- Security baselines: audit logs, rate limiting, health endpoint
