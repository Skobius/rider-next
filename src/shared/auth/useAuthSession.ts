import type { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../supabase/client';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
}

export function useAuthSession() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: isSupabaseConfigured,
    configured: isSupabaseConfigured,
  });

  useEffect(() => {
    if (!supabase) return undefined;

    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
        configured: true,
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
        configured: true,
      });
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
