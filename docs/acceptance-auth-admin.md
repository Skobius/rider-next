# MotoHub Auth/Admin Acceptance Checklist

Use separate test accounts. Do not store passwords, tokens, or service keys in this document.

## User

- Should see: public content, own profile, own favorites, own submissions.
- Can do: update own safe profile fields, add/remove own favorites, create own draft submission, submit own draft.
- Must not do: read another user's submission, assign roles, publish content, block users, read audit log.
- Direct forbidden attempts: role/admin RPC should return forbidden/401/403; inserts for another user should fail RLS.

## Owner

- Should see: own organization memberships and published public content.
- Can do: submit corrections or owner-related updates for own organization.
- Must not do: update published rows directly, edit another organization, change verification status, assign organization members.
- Direct forbidden attempts: direct update of places/organizations should fail RLS or return 0 updated rows.

## Moderator, Smolensk Region

- Should see: moderation queue only for `smolensk-oblast`, scoped moderation messages, scoped audit rows.
- Can do: move scoped submissions/ownership claims through review statuses.
- Must not do: view another region queue, assign roles, publish content outside moderator powers, assign superadmin.
- Direct forbidden attempts: role RPC should return forbidden; other-region moderation queries should return no rows.

## Moderator, Other Region

- Should see: moderation queue only for assigned other region.
- Can do: review submissions only in that region.
- Must not do: view Smolensk moderation queue or act on Smolensk claims/submissions.
- Direct forbidden attempts: Smolensk status RPC should return forbidden.

## Admin

- Should see: admin content tools for scoped regional content.
- Can do: edit/publish/archive content inside assigned region through RPC.
- Must not do: edit another region without scope, assign system roles, assign superadmin, manage users globally, read full audit log.
- Direct forbidden attempts: `assign_role`, `block_user`, and out-of-scope `update_content_summary` should return forbidden.

## Superadmin

- Should see: users and roles, content tools, moderation tools, audit log.
- Can do: assign/revoke roles, block/unblock users at application/RLS level, edit global content, view all regions.
- Must not do: remove or block the last active superadmin.
- Direct forbidden attempts: revoking/blocking the last active superadmin should return an error.

## Blocked User

- Should see: public content only as a guest-like viewer.
- Can do: sign out and read public published content.
- Must not do: edit profile, create submissions, write moderation messages, upload files, use privileged RPC through an old session.
- Direct forbidden attempts: profile updates should update no rows or fail; submissions/uploads/RPC should fail RLS or return forbidden.
