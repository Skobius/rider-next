# MotoHub Staging Setup

This guide prepares a separate Supabase staging project for closed acceptance. Do not use the production project or real user data.

## 1. Create Staging Project

In Supabase Dashboard create a new project, for example:

```text
motohub-staging
```

Save outside the repo:

- project ref;
- project URL;
- publishable or anon key;
- database password.

## 2. Login and Link

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase projects list
npx supabase migration list
```

If the CLI asks for the database password, enter it interactively. Do not commit it.

## 3. Apply Migrations

For a new empty staging database:

```bash
npm run supabase:staging:push
```

Do not run `supabase db reset` on remote staging after test data appears unless you intentionally want a full reset.

## 4. Load Seed Content

The seed contains only MotoHub content: regions, categories, places, routes, events, guides and exercises. It does not create real users or passwords.

Use a temporary shell variable:

```powershell
$env:SUPABASE_STAGING_DB_URL="postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres"
npm run supabase:staging:seed
Remove-Item Env:\SUPABASE_STAGING_DB_URL
```

Expected minimum counts:

- 1 region;
- 7 published categories;
- 10 places;
- 2 routes;
- 2 events;
- 15 guides;
- 10 exercises.

## 5. Deploy Edge Function

```bash
npx supabase functions deploy admin-user-access --project-ref <PROJECT_REF>
```

Required Supabase secrets:

```bash
npx supabase secrets set SUPABASE_URL=https://<PROJECT_REF>.supabase.co --project-ref <PROJECT_REF>
npx supabase secrets set SUPABASE_ANON_KEY=<ANON_OR_PUBLISHABLE_KEY> --project-ref <PROJECT_REF>
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY> --project-ref <PROJECT_REF>
```

The service role key is used only inside the Edge Function. Never put it in frontend env.

## 6. Frontend Env

Create local staging env from `.env.staging.example`:

```text
VITE_APP_ENV=staging
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_OR_ANON_KEY>
VITE_YANDEX_MAPS_API_KEY=<YANDEX_KEY>
```

Do not use any `VITE_` service role, database password or SMTP password.

## 7. Auth Settings

In Supabase Dashboard:

- enable Email/Password;
- set Site URL to local URL during testing, later staging domain;
- add redirect URLs:

```text
http://localhost:5173
http://localhost:5173/auth/callback
http://<LOCAL_IP>:5173
http://<LOCAL_IP>:5173/auth/callback
https://staging.<domain>
https://staging.<domain>/auth/callback
```

Built-in Supabase email is acceptable only for closed staging. Public launch needs SMTP, reviewed templates and anti-abuse limits.

## 8. First Superadmin

Follow [staging-bootstrap.md](./staging-bootstrap.md).

Short version:

1. Register one normal account through the staging frontend.
2. Confirm email.
3. Run:

```sql
select public.bootstrap_superadmin('<USER_EMAIL>');
```

4. Check `/admin/users` and audit log.

## 9. Test Accounts

Follow [staging-test-accounts.md](./staging-test-accounts.md).

Create accounts manually. Assign roles through `/admin/users` or trusted SQL. Do not store passwords in docs.

## 10. Run Frontend

Local:

```bash
npm run dev -- --host 0.0.0.0
```

Staging build:

```bash
npm run build
```

Deployment must serve `index.html` for all SPA routes, including `/login`, `/profile`, `/moderation`, `/admin/content`, `/admin/users`, `/admin/audit` and content details.

## 11. Run Staging Smoke Check

Use only public frontend env:

```bash
npm run supabase:test:smoke
```

The check reads public content, verifies expected counts and confirms draft rows are not exposed publicly. It does not insert or delete staging data.

## 12. Mobile Test

Follow [mobile-staging-test.md](./mobile-staging-test.md).

Remember:

- phone cannot use the computer's `localhost`;
- Supabase redirect URLs must include the local IP;
- Yandex Maps key must allow the local IP referer or staging domain.

## 13. End-to-End Acceptance

Scenario 1, new place:

1. user registers and logs in;
2. user creates draft submission for a place and uploads image;
3. public app does not show the draft;
4. Smolensk moderator sees it, other-region moderator does not;
5. moderator requests changes;
6. user receives notification and updates data;
7. moderator approves;
8. published card appears in places, search, counters and map when coordinates are confirmed;
9. version, audit log and notification are created.

Scenario 2, owner:

1. user submits ownership claim;
2. moderator requests evidence;
3. claim is approved;
4. organization membership is created;
5. owner sees "My organizations";
6. owner submits an update;
7. public card changes only after moderation;
8. version, audit log and notification are created.

Scenario 3, roles:

1. user cannot open admin;
2. owner cannot open moderation;
3. moderator sees only own region;
4. admin cannot assign superadmin;
5. superadmin assigns and revokes roles;
6. last superadmin cannot be blocked or revoked;
7. blocked user cannot login after Edge Function block;
8. unblocked user can login again.

## 14. Rollback

For staging only:

- if migrations fail on a new empty project, inspect the error and fix migration locally first;
- if seed partially fails, fix seed and rerun only if idempotency is preserved;
- if a full staging reset is needed, confirm it explicitly, then recreate from migrations and seed;
- never run destructive reset commands against production.
