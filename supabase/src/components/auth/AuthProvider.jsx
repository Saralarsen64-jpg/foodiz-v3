import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase, supabaseConfigError } from '../../lib/supabaseClient';

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('role, account_status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Foodiz] Impossible de charger le profil utilisateur.', error.message);
    return null;
  }

  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription;

    async function bootstrap() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession ?? null);
      setProfile(currentSession?.user?.id ? await fetchProfile(currentSession.user.id) : null);
      setLoading(false);

      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        setSession(nextSession ?? null);
        setProfile(nextSession?.user?.id ? await fetchProfile(nextSession.user.id) : null);
        setLoading(false);
      });

      subscription = authSubscription;
    }

    bootstrap();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      isSupabaseConfigured,
      supabaseConfigError,
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    }),
    [loading, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider.');
  }

  return context;
}
