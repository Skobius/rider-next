# MotoHub Backend

MotoHub uses Supabase as the backend foundation: PostgreSQL, Supabase Auth, Storage, Row Level Security and protected RPC functions.

## Local Setup

1. Install Supabase CLI and Docker.
2. Start local Supabase:

```bash
supabase start
```

3. Copy public values into `.env.local`:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local anon key from supabase status>
```

4. Apply migrations and seed:

```bash
supabase db reset
```

The reset also runs `supabase/seed.static.sql`, generated from the current app data:

```bash
node scripts/export-content-seed.mjs
```

Run the generator after changing static content in `src/data`, including places, routes, events, guides, skills, rider tasks or service definitions.

5. Run the app:

```bash
npm run dev
```

## First Superadmin

Do not store passwords or service role keys in the frontend or repository.

Safe bootstrap flow:

1. Register the first owner account through Supabase Auth or Supabase Studio.
2. Confirm the email locally.
3. Run SQL from a trusted admin channel:

```sql
select public.bootstrap_superadmin('gleb@example.com');
```

Replace the email with the real owner email. The function works only while no active superadmin exists and writes an audit event.

## Environment

Frontend-safe:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_YANDEX_MAPS_API_KEY`

Never expose:

- `SUPABASE_SERVICE_ROLE_KEY`
- SMTP credentials
- JWT secrets
- bootstrap credentials

## Production Checklist

- Configure production Supabase or self-hosted Supabase in the target data center.
- Configure SMTP and email confirmation.
- Configure CAPTCHA or an equivalent anti-bot check before opening public registration.
- Add rate-limit monitoring for submissions, visit reports and ownership claims.
- Enable MFA/TOTP for moderator, admin and superadmin accounts before production access.
- Add security headers and CSP at the production hosting layer.
- Add approved privacy policy and terms text before public registration.
- Configure backups and restore checks.
- Configure dependency audit and error monitoring.
- Review RLS policies with real test users.
- Move published images through `published-media`; keep unreviewed uploads in `submission-media`.

## Checks

```bash
npm run typecheck
npm run test
npm run i18n:check
npm run build
```

`npm run test` checks local search data and Supabase seed/RLS basics when Supabase env variables are configured.

## Current Backend Scope

- Auth, profiles and favorites are connected to Supabase.
- User submissions and ownership claims are connected to Supabase.
- Moderation screens can change submission and claim statuses through protected RPC functions.
- Public places, routes and events are seeded into Supabase and read by the app with static fallback.
- Guides, exercises and categories are seeded into Supabase for backend ownership of the content base.
- Rider tasks, task links, service definitions, place services, schedules, freshness policies, verification events, visit reports and owner confirmations are migrated and seeded where applicable.
- Place cards can accept "I was here" visit reports. These reports do not edit public cards directly; moderators accept or reject them.
- Owners can submit confirmation signals for place cards through their organization profile. Confirmations go through moderation.
- Moderators can see user signals and the recheck queue.
- Admin content can edit title, short description and status for places, routes, events, guides, exercises, categories, regions, rider tasks, service definitions and freshness policies.
- Admin analytics shows basic data-quality counters, recheck queue items and contribution stats.
- Superadmin can assign/revoke roles and block/unblock profiles through protected RPC functions.
- Superadmin can view audit log entries.
- Do not put service role keys in the browser.

## Remaining Production Work

- Add typed deep editors for complex JSON fields such as guide sections, route points, branches and contacts.
- Add Edge Functions or a trusted server endpoint for operations that require Supabase Auth Admin/service role privileges, such as email lookup and MFA enforcement.
- Configure production SMTP, CAPTCHA, backups, legal documents, CSP/security headers, monitoring and MFA/TOTP for privileged users.
- Expand automated tests with real signed-in users for role scopes, moderation transitions and publishing flows.
