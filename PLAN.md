# Lyra Health Platform Plan (Phase-wise)

## Planning Constraints
- Primary stack only: `Next.js`, `Supabase`, `Vercel`.
- Ignore the blueprint's suggested tech stack section.
- Target: enterprise mental wellness platform MVP for 2-3 pilot customers.

## Product Goals (From Blueprint)
- Provide end-to-end employee mental health support (assessment, matching, sessions, coaching, crisis workflows, tracking).
- Serve three core personas: `Employee`, `Provider`, `Employer Admin (HR)`.
- Launch an MVP with strong privacy/security posture and measurable business/clinical outcomes.

## Phase 0: Discovery, Compliance, and Architecture (Week 1-2)
### Objectives
- Lock MVP scope and compliance boundaries before coding core PHI workflows.

### Scope
- Convert blueprint features into MVP backlog with acceptance criteria.
- Define role model and access matrix:
  - Employee
  - Provider
  - Employer Admin
  - System Admin
- Finalize data model for core entities:
  - users, organizations, providers, assessments, appointments, sessions, progress_notes, moods, resources, messages, crisis_events
- Establish compliance baseline:
  - PHI data classification
  - audit logging requirements
  - retention/deletion policies
  - incident response runbook draft
- Confirm production readiness requirements for `Supabase` and `Vercel` environments (including legal/security controls required by customer contracts).

### Deliverables
- MVP PRD + prioritized backlog.
- ERD and Supabase schema draft.
- Security/compliance checklist and go-live gates.
- Phase-level timeline and ownership map.

### Exit Criteria
- All MVP stories estimated and prioritized.
- Data model and RBAC approved.
- Compliance checklist signed off for Phase 1 implementation.

## Phase 1: Platform Foundation (Week 3-5)
### Objectives
- Build secure app foundation and multi-tenant architecture.

### Scope
- Initialize `Next.js` app (App Router, TypeScript, server components where useful).
- Configure `Supabase` project:
  - Postgres schema + migrations
  - Supabase Auth (email + SSO-ready design)
  - Row Level Security (RLS) policies for tenant isolation
  - Storage buckets for documents/resources
- Build core platform modules:
  - authentication + session management
  - organization onboarding
  - role-based route protection
  - audit/event logging tables
- Set up deployment on `Vercel`:
  - Preview/Production environments
  - environment variable strategy
  - deployment checks and rollback process

### Deliverables
- Running multi-tenant skeleton app deployed on Vercel.
- Auth + RBAC + tenant isolation working end-to-end.
- CI/CD and migration workflow documented.

### Exit Criteria
- Security tests pass for unauthorized data access scenarios.
- Core auth journeys pass UAT for all roles.

## Phase 2: Employee Care Journey MVP (Week 6-9)
### Objectives
- Deliver employee-facing must-have workflows.

### Scope
- Employee self-assessment:
  - intake questionnaire flows
  - risk scoring rules (rules-based MVP)
- Therapist/provider matching MVP:
  - constraints: specialty, language, availability, location/timezone
  - explainable matching score (non-ML in MVP)
- Appointment scheduling:
  - provider availability calendar
  - booking/reschedule/cancel
  - reminders via app notifications/email hooks
- Progress tracking dashboard:
  - mood logs
  - goals and trend visualization
- Resource library:
  - curated articles/videos/worksheets
  - filtering by topic and need

### Deliverables
- Employee app flows complete from intake to first booking.
- Progress dashboard and resource library live.

### Exit Criteria
- Employee can complete assessment and book first appointment in one session.
- Matching recommendations are traceable and clinically reviewable.

## Phase 3: Provider Workflows + Session Delivery (Week 10-12)
### Objectives
- Enable providers to deliver care and document progress safely.

### Scope
- Provider workspace:
  - profile and credential fields
  - schedule/availability management
  - caseload view
- Session delivery:
  - secure browser-based video session flow
  - session status lifecycle (scheduled, in-progress, completed, missed)
- Clinical documentation:
  - session notes
  - treatment plan updates
  - progress check-ins
- Secure messaging between employee and provider.
- Crisis workflow foundation:
  - emergency flags from assessments/messages
  - escalation queue + response tracking

### Deliverables
- Provider portal with full appointment/session lifecycle.
- Messaging and crisis-flag pipeline available to operations staff.

### Exit Criteria
- Providers can run sessions and complete notes end-to-end.
- Crisis events are captured, escalated, and auditable.

## Phase 4: Employer Analytics + Operational Controls (Week 13-15)
### Objectives
- Deliver employer value with privacy-preserving insights and controls.

### Scope
- Employer Admin dashboard (aggregated, anonymized):
  - enrollment/utilization
  - time-to-first-appointment
  - session completion trends
  - engagement and outcome proxies
- Compliance reporting exports:
  - audit logs
  - access reports
  - policy adherence indicators
- Operational tooling:
  - provider network management basics
  - organization settings and benefit eligibility rules

### Deliverables
- HR analytics dashboard + exportable reports.
- Admin controls for organizations/providers.

### Exit Criteria
- No individual PHI exposed in employer views.
- Pilot employers can measure adoption and care access KPIs.

## Phase 5: Pilot Launch, Hardening, and GTM Validation (Week 16-18)
### Objectives
- Launch pilots and validate product-market fit with real enterprise workflows.

### Scope
- Pilot onboarding for 2-3 enterprise customers.
- Reliability/performance hardening:
  - query optimization
  - alerting and error monitoring
  - incident drills
- Security hardening:
  - penetration-style checks
  - policy verification for RLS and admin actions
- KPI tracking setup:
  - engagement rate
  - time to first appointment
  - session completion
  - retention/churn indicators

### Deliverables
- Production pilot release on Vercel.
- Weekly pilot scorecards and issue tracker.

### Exit Criteria
- Pilot success criteria met for usage and workflow completion.
- Prioritized post-MVP roadmap approved.

## Phase 6: Post-MVP Expansion (After Pilot)
### Candidate Features (From Blueprint Priorities)
- Multi-language support
- Group therapy
- Family support resources
- Insurance integration
- Advanced predictive analytics and AI triage

### Approach
- Add features only after pilot metrics justify expansion.
- Keep architecture within `Next.js + Supabase + Vercel`; introduce external tools only when mandatory and behind clear interfaces.

## Feature-to-Phase Mapping (MVP)
- Self-assessment: Phase 2
- Therapist matching: Phase 2
- Appointment scheduling: Phase 2
- Progress dashboard + mood tracking: Phase 2
- Video sessions: Phase 3
- Secure messaging: Phase 3
- Crisis intervention workflow: Phase 3-4
- Employer analytics dashboard: Phase 4
- Provider network management basics: Phase 4

## Execution Notes
- Start with rules-based matching and deterministic workflows; defer complex AI until post-MVP.
- Treat privacy, RLS correctness, and auditability as release blockers in every phase.
- Keep deployment simple: one web app on Vercel, data/auth/storage in Supabase, strict environment separation.
