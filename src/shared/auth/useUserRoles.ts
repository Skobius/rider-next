import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuthSession } from './useAuthSession';

export type AppRole = 'user' | 'moderator' | 'admin' | 'superadmin';

interface RoleAssignmentRow {
  scope_type: 'global' | 'region';
  scope_id: string | null;
  roles: { code: AppRole } | null;
}

export function useUserRoles() {
  const { user, configured } = useAuthSession();
  const [rows, setRows] = useState<RoleAssignmentRow[]>([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!supabase || !user) {
      setRows([]);
      setLoading(false);
      return;
    }

    async function loadRoles() {
      setLoading(true);
      const { data } = await supabase!
        .from('user_role_assignments')
        .select('scope_type, scope_id, roles(code)')
        .eq('user_id', user!.id)
        .is('revoked_at', null);
      setRows((data ?? []) as unknown as RoleAssignmentRow[]);
      setLoading(false);
    }

    void loadRoles();
  }, [user]);

  return useMemo(() => {
    const roleCodes = rows.map((row) => row.roles?.code).filter(Boolean) as AppRole[];
    const isSuperadmin = roleCodes.includes('superadmin');
    const isAdmin = isSuperadmin || roleCodes.includes('admin');
    const isModerator = isAdmin || roleCodes.includes('moderator');

    return { configured, user, rows, loading, roleCodes, isModerator, isAdmin, isSuperadmin };
  }, [configured, loading, rows, user]);
}
