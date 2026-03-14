# DECISIONS

## 2026-03-14
- Primary stack constrained to `Next.js + Supabase + Vercel`.
- Use App Router + TypeScript strict mode.
- Enforce tenant isolation with Supabase RLS on all tenant-scoped tables.
- Use deterministic therapist matching for MVP; defer advanced AI models.
- Keep employer reporting aggregated/anonymized; no individual PHI in employer dashboards.
- Add audit logging for sensitive domain mutations.
- Add in-app rate limiting for sensitive API endpoints as baseline protection.
- Use TanStack Query for client-side server-state synchronization in role workflows.
- Remove dependency on remote Google Fonts in layout to make builds deterministic in restricted environments.
- Validate this delivery using Node `v24.8.0`.
