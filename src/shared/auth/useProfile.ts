import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuthSession } from './useAuthSession';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  home_region_id: string | null;
  account_status: 'active' | 'blocked' | 'deleted';
  privacy_accepted_at: string | null;
  terms_accepted_at: string | null;
  last_seen_at: string | null;
}

export function useUserProfile() {
  const { user, configured } = useAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, home_region_id, account_status, privacy_accepted_at, terms_accepted_at, last_seen_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      setError('Не удалось загрузить профиль.');
      setProfile(null);
    } else {
      setProfile(data);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function updateProfile(values: Partial<Pick<UserProfile, 'display_name' | 'home_region_id'>>) {
    if (!supabase || !user) return { ok: false, error: 'Backend не подключён.' };

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ ...values, last_seen_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('id, display_name, avatar_url, home_region_id, account_status, privacy_accepted_at, terms_accepted_at, last_seen_at')
      .single();

    if (updateError) {
      return { ok: false, error: 'Не удалось сохранить профиль.' };
    }

    setProfile(data);
    return { ok: true, error: '' };
  }

  return { configured, user, profile, loading, error, reloadProfile: loadProfile, updateProfile };
}
