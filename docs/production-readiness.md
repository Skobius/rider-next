# MotoHub Production Readiness

## Supabase

- Create a production Supabase project in the closest practical region.
- Apply all migrations from `supabase/migrations`.
- Import the generated seed from `supabase/seed.sql`.
- Create the first real user, then bootstrap the first superadmin from a trusted SQL/admin context only.
- Confirm no production superadmin password or service role key is stored in the repo.

## Auth

- Configure SMTP and sender identity.
- Set redirect URLs for local, staging, and production domains.
- Configure allowed origins for the production domain.
- Review email templates for signup, login, recovery, and email change.
- Decide whether MFA is required for admin and superadmin accounts.
- Add captcha or anti-abuse controls if public registration is enabled.
- Define and test account deletion/export policy.

## Environment

- Set only public browser variables with `VITE_`.
- Keep service role, database password, SMTP password, JWT secret, and bootstrap secrets server-side only.
- Run a service-role leak check before every public deployment.

## Storage

- Confirm buckets: `avatars`, `submission-media`, `published-media`.
- Keep `submission-media` private.
- Keep `published-media` public only for approved assets.
- Confirm allowed MIME types exclude SVG, HTML, JavaScript, and executable files.
- Confirm file-size limits fit production needs.

## Operations

- Enable backups and document restore steps.
- Run a restore test before launch.
- Enable monitoring for auth errors, database errors, storage errors, and API limits.
- Confirm rate limits and abuse thresholds.
- Prepare legal pages: privacy policy, terms, moderation/contact rules.

## Final Checks

- Run `npx supabase db reset`.
- Run SQL/RLS security checks.
- Run `npm run typecheck`.
- Run `npm run test`.
- Run `npm run i18n:check`.
- Run `npm run build`.
- Check mobile and desktop layouts on the production build.
- Verify the map key and allowed origins for the final domain.
