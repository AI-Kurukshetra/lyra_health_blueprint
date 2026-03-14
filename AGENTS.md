# AGENTS.md (AI-Optimized v2)

Purpose: Defines operating rules for Codex agents building a production
Next.js + Supabase app on Vercel.

------------------------------------------------------------------------

## 1. System Overview

Stack

Framework: Next.js 16 (App Router) Language: TypeScript strict Database:
Supabase Postgres Auth: Supabase Auth (SSR) Hosting: Vercel Styling:
Tailwind CSS UI: shadcn/ui + Radix Validation: Zod Server State:
TanStack Query Testing: Vitest + Playwright Package Manager: pnpm AI
Runtime: Codex CLI multi-agent

------------------------------------------------------------------------

## 2. AI Memory System (/doc)

Folder structure

/doc PRD.md TASKS.md PROGRESS.md BLOCKERS.md CHANGELOG.md DECISIONS.md
SCHEMA.md ARCHITECTURE.md

All agents must read these before starting work.

------------------------------------------------------------------------

## 3. Mandatory Session Startup

Read:

/doc/TASKS.md /doc/PROGRESS.md /doc/BLOCKERS.md /doc/DECISIONS.md

Then summarize:

-   completed tasks
-   tasks in progress
-   blockers
-   next task

------------------------------------------------------------------------

## 4. Task Lifecycle

PLAN → IMPLEMENT → VERIFY → TEST → REVIEW → DOCUMENT → COMMIT

No step may be skipped.

------------------------------------------------------------------------

## 5. Multi-Agent Architecture

Coordinator responsibilities:

-   read project context
-   break tasks into subtasks
-   spawn agents
-   validate outputs
-   update docs

Coordinator should not write production code when specialist agents
exist.

------------------------------------------------------------------------

## 6. Agent Roles

frontend --- UI, components, layouts backend --- API routes and server
actions database --- Supabase migrations and RLS tester --- unit and E2E
tests reviewer --- security and quality review devops --- deployment and
infra

------------------------------------------------------------------------

## 7. Deterministic Execution Pipeline

Database → Backend → Frontend → Testing → Review → Commit → Deploy

Agent pipeline

$db-migration$api-endpoint $frontend-design$tester $pr-review$deploy

------------------------------------------------------------------------

## 8. Self-Healing Agent Logic

Retry workflow

attempt = 1 max_attempts = 2

If failure persists after retry:

Log blocker in `/doc/BLOCKERS.md`

------------------------------------------------------------------------

## 9. Project Structure

/ app/ components/ lib/ hooks/ types/ public/ supabase/ tests/ doc/
.codex/ .agents/

------------------------------------------------------------------------

## 10. Next.js Rules

Default: Server Components

Client components must start with

"use client"

Forbidden

useEffect(fetch)

Allowed

Server Components Server Actions TanStack Query

Images must use `next/image`.

------------------------------------------------------------------------

## 11. Supabase Standards

Server client

lib/supabase/server.ts

Client

lib/supabase/client.ts

Security

-   RLS enabled
-   explicit policies
-   Zod validation before writes
-   no service role keys in client

Migrations

supabase/migrations/YYYYMMDDHHMM.sql

Document changes in

/doc/SCHEMA.md

------------------------------------------------------------------------

## 12. Environment Variables

Client safe

NEXT_PUBLIC\_\*

Server only

SUPABASE_SERVICE_ROLE_KEY DATABASE_URL

Commit `.env.example` only.

------------------------------------------------------------------------

## 13. TypeScript Standards

Required

strict: true noImplicitAny: true

Rules

-   no any
-   use unknown
-   validate with Zod
-   named exports only

------------------------------------------------------------------------

## 14. UI System

Allowed

Tailwind CSS shadcn/ui Radix

Forbidden

CSS modules styled-components inline CSS

------------------------------------------------------------------------

## 15. State Management

Server state --- TanStack Query Forms --- React Hook Form Local state
--- useState Global state --- Zustand (rare)

------------------------------------------------------------------------

## 16. Testing

Unit

Vitest

Run

pnpm test

E2E

Playwright

Run

pnpm test:e2e

------------------------------------------------------------------------

## 17. Git Workflow

Commit examples

feat(auth): add signup flow fix(db): correct RLS policy test(api): add
endpoint tests docs: update architecture

Branches

feat/feature fix/bug chore/refactor

------------------------------------------------------------------------

## 18. Deployment

Deployment pipeline

Local → Preview → Staging → Production

Agents must never deploy directly to production.

------------------------------------------------------------------------

## 19. CI Requirements

pnpm lint pnpm typecheck pnpm test pnpm build

------------------------------------------------------------------------

## 20. Security Rules

Never

-   commit secrets
-   expose service role keys
-   bypass RLS
-   trust client input

Always validate inputs with Zod.

------------------------------------------------------------------------

## 21. Logging

Production code must not contain console.log.

Use structured logging.

------------------------------------------------------------------------

## 22. Anti‑Patterns

Never

-   use any
-   fetch data in useEffect
-   skip migrations
-   disable RLS
-   skip tests
-   skip documentation updates

------------------------------------------------------------------------

## 23. Blocker Escalation

If blocked:

Stop work.

Write entry to

/doc/BLOCKERS.md

Format

\[DATE\] BLOCKER --- agent-name

Problem: Attempted: Needs:

------------------------------------------------------------------------

## 24. Automatic Documentation Updates

After completing tasks update

TASKS.md PROGRESS.md CHANGELOG.md

------------------------------------------------------------------------

## 25. Agent Reliability Rules

Agents must verify

-   files written correctly
-   build passes
-   tests pass
-   schema matches documentation

If verification fails → retry.

------------------------------------------------------------------------

## 26. Autonomous Development Mode

Loop

read context → plan task → execute → test → update docs → commit

Continue until TASKS.md has no remaining tasks.

------------------------------------------------------------------------

## 27. AI Session Recovery

If session resets

Read

/doc/TASKS.md /doc/PROGRESS.md /doc/BLOCKERS.md

Reconstruct project state.

------------------------------------------------------------------------

## 28. Production Readiness Checklist

Before release verify

-   migrations applied
-   RLS policies tested
-   env variables configured
-   build successful
-   tests passing
-   preview deployed
-   staging validated
