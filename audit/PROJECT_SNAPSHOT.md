# MotoHub Project Snapshot

Date: 2026-07-31  
Workspace: `C:\work\rider-next`  
Git storage note: the normal `.git` directory is empty in this workspace; audit git commands were run with `--git-dir=.gitrepo --work-tree=.`.

## 1. General Architecture

MotoHub is a React/Vite/TypeScript PWA with React Router. The app is built around local motorcycle help: search, places, map, practical guides, rider tasks, user profile, moderation and admin tools.

- Frontend: React 19, TypeScript, Vite, React Router, Zustand for local stores, Lucide icons.
- Backend: Supabase PostgreSQL, Supabase Auth, Storage, RLS, SQL RPC functions, one Edge Function.
- PWA: configured through `vite-plugin-pwa`, `manifest.webmanifest`, service worker generation and app icons in `public/assets/brand`.
- Map: Yandex Maps API key is read from `VITE_YANDEX_MAPS_API_KEY`; map screen is lazy-loaded.
- Localization: Russian and English dictionaries in `src/shared/i18n/translations.ts`; Russian is the primary product language.
- Storage: Supabase buckets are created by migration for `avatars`, `submission-media`, and `published-media`.
- Edge Functions: `supabase/functions/admin-user-access/index.ts` for protected admin user access operations.

## 2. Local Run

Required programs:

- Node.js/npm
- Docker Desktop for local Supabase
- Supabase CLI

Useful commands:

```bash
npm run dev
npm run typecheck
npm run test
npm run i18n:check
npm run build
npm run supabase:local:reset
node scripts/export-content-seed.mjs
```

Local frontend:

- Desktop: `http://localhost:5173`
- Phone on the same Wi-Fi: `http://<computer-lan-ip>:5173`, for example `http://192.168.2.98:5173`

Local Supabase from current `.env.local` convention:

- API URL: `http://127.0.0.1:54321`
- Studio usually: `http://127.0.0.1:54323`

Important: this audit did not run `supabase db reset`.

## 3. Current Routes

| URL | Purpose | Access | Data Source | Status |
| --- | --- | --- | --- | --- |
| `/` | Redirect to search/home | Public | Router | working |
| `/search` | Main screen and local/global search results | Public | `src/data`, backend fallback | working |
| `/sections` | Section overview | Public | `src/data/categories.ts` | working |
| `/sections/:slug` | Section overview with selected area | Public | `src/data/categories.ts` | working |
| `/sections/:sectionSlug/:categorySlug` | Category listing | Public | `src/data` | working |
| `/guides/:slug` | Guide page | Public | `src/data/guides.ts` | working |
| `/tasks/:slug` | Rider task page | Public | `src/data/riderTasks.ts`, places, guides, skills | working |
| `/skill/:id` | Skill/exercise page | Public | `src/data/skills.ts` | working |
| `/placeholder/:id` | Placeholder screen | Public | static page | partial |
| `/place/:id` | Place details | Public; visit report needs auth | backend/static fallback | working |
| `/route/:id` | Route details | Public | backend/static fallback | working |
| `/event/:id` | Event details | Public | backend/static fallback | working |
| `/tip/:id` | Tip details | Public | static data | working |
| `/notifications` | Notifications list | User-oriented; empty state possible | Supabase/local state | partial |
| `/region` | Region selection | Public | `src/data/regions.ts`, local storage | working |
| `/map` | Yandex map with places/routes/events | Public; needs map API key | backend/static fallback | working, API-key dependent |
| `/favorites` | Favorites | Public local mode | local storage | working |
| `/profile` | Profile and admin entry points | Public; role items gated | Supabase Auth/local settings | working |
| `/profile/account` | Account details | Auth recommended | Supabase Auth/profile | working |
| `/profile/submissions` | User submissions | Auth required for submit | `content_submissions` | working |
| `/profile/claims` | Ownership claims | Auth required | `ownership_claims` | working |
| `/profile/organizations` | Owner organizations and confirmations | Auth required | `organization_memberships`, `owner_confirmations` | partial |
| `/moderation` | Moderation queue | Moderator/admin/superadmin | submissions, claims, visit reports, recheck queue | working |
| `/admin/content` | Basic content editor | Admin/superadmin | Supabase tables/RPC | partial |
| `/admin/analytics` | Data quality analytics | Admin/superadmin | count queries/views | partial |
| `/admin/users` | User roles and blocking | Superadmin | RPC and profiles | working |
| `/admin/audit` | Audit log | Superadmin | `audit_log` | working |
| `/install` | PWA install helper | Public | browser PWA APIs | working |
| `/settings/language` | Language setting | Public | local storage | working |
| `/settings/theme` | Theme setting | Public | local storage | working |
| `/settings/notifications` | Notification preferences placeholder | Public | local storage | partial |
| `/settings/behavior` | Behavior/density setting | Public | local storage | working |
| `/feedback` | Feedback/mailto and pending channel | Public | mailto/config | partial |
| `/about` | About project | Public | static | working |
| `/about-mg67` | About MG67 | Public | static | working |
| `/privacy` | Legal placeholder | Public | static | stub |
| `/terms` | Legal placeholder | Public | static | stub |
| `/auth` | Login/register/password reset screen | Public | Supabase Auth | partial |

## 4. User Scenarios

Guest:

- Opens `/search`, sees "Что вам нужно?", search and featured rider tasks.
- Searches places, guides, routes, events, skills and rider tasks.
- Opens place, route, event, guide, skill and task pages.
- Selects region locally.
- Uses map if Yandex Maps key is configured.
- Saves favorites locally.

Registered user:

- Can sign in/register through Supabase Auth screen.
- Can edit account/profile basics.
- Can create content submissions.
- Can create ownership claims.
- Can send "Вы были здесь?" visit reports from place cards.
- Can see personal submissions and claims.

Organization owner:

- Appears in `/profile/organizations` after approved ownership claim creates membership.
- Can send owner confirmation that a place card is still current.
- Cannot directly change public place data through the current UI.

Moderator:

- Can open `/moderation`.
- Can review content submissions and ownership claims.
- Can review visit reports and create verification events by accepting a signal.
- Can see recheck queue.

Admin:

- Has moderator capabilities.
- Can open `/admin/content`.
- Can edit basic title/description/status for existing backend rows.
- Can open `/admin/analytics`.

Superadmin:

- Has admin capabilities.
- Can open `/admin/users`.
- Can assign/revoke roles and block/unblock users through protected RPC functions.
- Can open `/admin/audit`.
- Can bootstrap first superadmin only while no active superadmin exists.

## 5. Content

Static seed count from `supabase/seed.static.sql`:

- Regions: many Russian regions in `src/data/regions.ts`; only `smolensk-oblast` is marked available in static data.
- Places: 11.
- Routes: 2.
- Events: 2.
- Guides: 15.
- Exercises/skills: 10.
- Rider tasks: 3.
- Categories: 54.
- Service definitions: 10.

Backend smoke check currently verifies:

- 11 places.
- 2 routes.
- 2 events.
- 15 guides.
- 10 exercises.
- 7 visible categories through the current backend check threshold.
- 3 rider tasks.
- 10 service definitions.

Sources:

- TypeScript static data in `src/data`.
- Generated SQL seed in `supabase/seed.sql` and `supabase/seed.static.sql`.
- Runtime backend reads for places/routes/events in `src/shared/content/backendContent.ts`, with static fallback.

No real organizations are seeded in the static content base.

## 6. Backend

Main tables from migrations:

- Core: `regions`, `categories`, `roles`, `profiles`, `user_role_assignments`.
- Organizations: `organizations`, `organization_memberships`, `ownership_claims`, `owner_confirmations`.
- Content: `places`, `routes`, `events`, `guides`, `exercises`, `content_versions`, `content_submissions`.
- User/product: `favorites`, `notifications`, `storage_assets`, `moderation_messages`, `audit_log`.
- Rider tasks and quality: `rider_tasks`, `rider_task_links`, `service_definitions`, `place_service_definitions`, `place_schedules`, `freshness_policies`, `verification_events`, `visit_reports`, `app_rate_limits`.

Views:

- `place_trust_summaries`
- `recheck_queue`
- `user_contribution_stats`

RPC/functions:

- `bootstrap_superadmin`
- `submit_submission`
- `set_submission_status`
- `submit_ownership_claim`
- `set_ownership_claim_status`
- `update_content_summary`
- `assign_role`
- `revoke_role`
- `block_user`
- `unblock_user`
- `guard_visit_report_limits`
- helper/security functions: `touch_updated_at`, `create_profile_for_new_user`, `is_active_user`, `has_role`, `is_superadmin`, `can_moderate_region`, `can_admin_region`, `is_organization_member`, `write_audit`

Storage buckets:

- `avatars`
- `submission-media`
- `published-media`

Main RLS model:

- Public can read published content and published media.
- Authenticated users manage their own favorites, submissions, claims, notifications and assets.
- Moderators read scoped submissions/claims/audit and can process scoped moderation items.
- Admins manage scoped public content.
- Superadmins manage global roles, users, rate limits and sensitive admin operations.
- Visit reports are insert-only by active user and moderated before becoming verification signal.

Privileged frontend paths:

- User submission: `/profile/submissions` -> `content_submissions` insert -> `submit_submission`.
- Ownership claim: `/profile/claims` -> `ownership_claims` insert -> `submit_ownership_claim`.
- Moderation: `/moderation` -> `set_submission_status`, `set_ownership_claim_status`, direct moderated updates to `visit_reports`, insert to `verification_events`.
- Admin content: `/admin/content` -> `update_content_summary` for legacy content, direct RLS-protected updates for tasks/services/freshness.
- Admin users: `/admin/users` -> role/block RPC functions.
- Owner confirmation: `/profile/organizations` -> `owner_confirmations` insert.

## 7. Feature Readiness

| Feature | Implemented | Connected to UI | Tested by automation | Manually verified | Limits |
| --- | --- | --- | --- | --- | --- |
| Public browsing | Yes | Yes | Yes | Not in this audit | Visual QA still useful |
| Region selection | Yes | Yes | i18n/typecheck | Not in this audit | Only Smolensk has real content |
| Places | Yes | Yes | Yes | Not in this audit | Some data still marked pending |
| Map | Yes | Yes | Build/typecheck | Not in this audit | Requires Yandex API key |
| Search | Yes | Yes | Yes | Not in this audit | Local/static indexing |
| Rider tasks | Yes | Yes | Yes | Not in this audit | 3 tasks only |
| Registration/login | Partial | Yes | Typecheck/build | Not in this audit | Production email/CAPTCHA not configured |
| Email confirmation | Backend/Auth capable | Not product-polished | No | No | Needs production Supabase setup |
| Password recovery | Partial | Auth screen | Typecheck/build | No | Needs Supabase email setup |
| Profile | Yes | Yes | Typecheck/build | No | Some strings still mixed direct/i18n |
| Favorites | Yes | Yes | Typecheck/build | No | Local-first, not fully backend sync |
| Suggest place | Yes | Yes | Security/RLS coverage | No | Content moderation required |
| Suggest correction | Yes | Yes | Security/RLS coverage | No | Feedback path partly mailto/pending |
| Ownership claim | Yes | Yes | Security/RLS coverage | No | Owner editor is not deep |
| Owner editing | Partial | Partial | Typecheck/build | No | Confirmation exists, direct editing not implemented |
| Moderation | Yes | Yes | Security/RLS coverage | No | UI is basic |
| Content management | Partial | Yes | Typecheck/build | No | Basic fields only |
| User management | Yes | Yes | Security/RLS coverage | No | Superadmin only |
| Audit log | Yes | Yes | Security/RLS coverage | No | Read-only UI |
| Freshness/verification | Yes | Partial | Security/RLS coverage | No | Freshness is basic queue/view |
| Visit reports | Yes | Yes | Security/RLS coverage | No | No photo upload UI |
| Notifications | Partial | Partial | Typecheck/build | No | No production push delivery |
| User blocking | Yes | Yes | Security/RLS coverage | No | Superadmin only |
| Staging | Partial | Scripts/docs | Smoke scripts exist | No | Remote staging not applied in this audit |

## 8. Known Issues and Limits

- `.git` is empty; the actual git database appears to be `.gitrepo`. Normal `git status` fails unless `--git-dir=.gitrepo --work-tree=.` is used.
- There are many uncommitted changes.
- `npm run test` skips `security-check` in the default sandbox because Docker access is unavailable; the script can run when Docker is available.
- `npm run build` initially fails in sandbox with `EPERM` when Vite writes to `node_modules/.vite-temp`; rerun with permission succeeds.
- Map depends on a valid Yandex Maps API key and HTTP referrer configuration.
- Auth email confirmation, SMTP, CAPTCHA, MFA, CSP, backups and monitoring are production/staging configuration tasks, not completed inside this code snapshot.
- Admin content editor is intentionally shallow: title, description and status only.
- Owner workflow allows claim and confirmation, but not full owner-side structured editing.
- Notifications screen and settings are partially placeholder.
- Privacy and terms are placeholders.
- Some Russian text files display mojibake in PowerShell output, though TypeScript/build checks pass.

## 9. Last Large Product Iteration

Latest iteration status:

- Rider tasks: implemented and connected to home/search/routes.
- New main page priority: implemented around "Что вам нужно?" and featured tasks.
- Structured services: backend schema, seed, backend read mapping and place detail display implemented.
- Schedules: backend schema and seed import from branches implemented; UI still mostly uses existing branch schedule display.
- Verification events: backend schema, RLS and moderation creation from accepted visit report implemented.
- Freshness: backend policies, views and admin/moderation queue implemented at a basic level.
- "Вы были здесь?": UI and backend insert implemented; moderation accepts/rejects.
- Recheck queue: view and admin/moderation UI implemented.
- Contributions: view and admin analytics display implemented.

Files changed in this iteration can be reviewed in:

- `audit/changed-files.txt`
- `audit/diff-stat.txt`
- `audit/current-working-tree.patch`

## 10. Last Known Stable Point

Likely last stable committed point: `81b57f2 (HEAD -> main, origin/main) Add Supabase backend and staging setup`.

Reason:

- It is the current HEAD/origin main commit before the uncommitted working-tree changes.
- The current working tree contains the large MotoHub rider-task/service/freshness iteration plus logo and UI changes.
- New changes are separable through `git diff HEAD`, saved as `audit/current-working-tree.patch`.

No rollback was performed.

## 11. Checks Performed In This Audit

- `npm run typecheck`: passed.
- `npm run test`: passed search and backend checks; security check skipped in sandbox with message that local Docker/Supabase container is unavailable.
- `npm run i18n:check`: passed.
- `npm run build`: first run failed with Vite `EPERM` writing `node_modules/.vite-temp`; rerun with permission passed.

Build warning:

- Vite reports a chunk larger than 500 kB after minification.

No `supabase db reset`, commit, push, checkout, reset or rollback was performed.
