# MotoHub Staging Test Accounts

Do not write emails or passwords here. Create accounts manually and store credentials outside the repository.

## Account Set

| Account | Required role | Scope | What to check |
| --- | --- | --- | --- |
| User | `user` | global | Register, login, profile, favorites, own submissions. |
| Owner | organization owner | one organization | Sees only own organizations and submits owner updates. |
| Moderator Smolensk | `moderator` | `smolensk-oblast` | Sees and moderates only Smolensk submissions. |
| Moderator Other Region | `moderator` | another region id | Does not see Smolensk submissions. |
| Admin Smolensk | `admin` | `smolensk-oblast` | Edits/publishes scoped content, cannot assign roles. |
| Superadmin | `superadmin` | global | Manages roles/users, sees audit log. |
| Blocked user | no effective access | app/RLS/Auth blocked | Cannot login after Edge Function block and cannot act through old session. |

## Owner Setup

Create or choose a staging organization, then add one active owner membership:

```sql
insert into public.organization_memberships (organization_id, user_id, membership_role, status, granted_by)
values ('<ORGANIZATION_UUID>', '<OWNER_USER_UUID>', 'owner', 'active', '<SUPERADMIN_UUID>');
```

The owner must not receive access to other organizations.

## Role Assignment

Prefer the `/admin/users` screen as superadmin. For direct SQL verification:

```sql
select p.id, p.display_name, r.code, ura.scope_type, ura.scope_id, ura.revoked_at
from public.user_role_assignments ura
join public.roles r on r.id = ura.role_id
join public.profiles p on p.id = ura.user_id
order by ura.created_at desc;
```
