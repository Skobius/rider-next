# MotoHub Staging Bootstrap

Use this only for a new staging project. Do not store real UUIDs, emails, passwords, or keys in the repo.

## 1. Register First Account

1. Open the frontend connected to staging.
2. Register a normal account.
3. Confirm email if confirmation is enabled.
4. In Supabase Dashboard open **Authentication → Users**.
5. Copy the user UUID.

## 2. Assign First Superadmin

Run this from Supabase SQL Editor or a trusted SQL connection:

```sql
select public.bootstrap_superadmin('<USER_EMAIL>');
```

Use the email of the already registered staging account. The function refuses to run after the first active superadmin exists.

## 3. Verify Role

```sql
select p.id, p.display_name, r.code, ura.scope_type, ura.scope_id, ura.revoked_at
from public.user_role_assignments ura
join public.roles r on r.id = ura.role_id
join public.profiles p on p.id = ura.user_id
where p.id = '<USER_UUID>';
```

Expected: one active `superadmin` role with `scope_type = global`.

## 4. Verify Audit

```sql
select action, target_type, target_id, created_at
from public.audit_log
where action = 'bootstrap_superadmin'
order by created_at desc
limit 5;
```

## 5. Verify Public Bootstrap Is Closed

`bootstrap_superadmin` is not granted to `anon` or `authenticated`. A browser/client RPC call should fail.
