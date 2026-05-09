import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase, supabaseConfigError } from '../../lib/supabaseClient';

const AuthContext = createContext(null);

function makeReferralCode(seed = 'foodiz') {
  return `fdz-${seed.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function getRoleHomePath(role) {
  switch (role) {
    case 'client':
      return '/client';
    case 'partner':
      return '/partner';
    case 'courier':
      return '/courier';
    case 'admin':
      return '/admin';
    default:
      return '/auth';
  }
}

async function fetchProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, first_name, last_name, phone, role, account_status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Foodiz] Impossible de charger le profil utilisateur.', error.message);
    return null;
  }

  return data;
}

async function createClientProfile(user, fallbackData = {}) {
  if (!supabase || !user?.id || !user?.email) return null;

  const profilePayload = {
    user_id: user.id,
    email: user.email,
    role: 'client',
    account_status: 'active',
    first_name: fallbackData.firstName ?? user.user_metadata?.first_name ?? null,
    last_name: fallbackData.lastName ?? user.user_metadata?.last_name ?? null,
    phone: fallbackData.phone ?? user.user_metadata?.phone ?? null,
    referral_code: makeReferralCode(user.id),
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(profilePayload)
    .select('user_id, email, first_name, last_name, phone, role, account_status')
    .single();

  if (error) {
    console.warn('[Foodiz] Création auto du profil client impossible.', error.message);
    return null;
  }

  const { error: loyaltyError } = await supabase
    .from('loyalty_accounts')
    .insert({ client_user_id: user.id })
    .select('client_user_id')
    .maybeSingle();

  if (loyaltyError) {
    console.warn('[Foodiz] Création du compte fidélité ignorée.', loyaltyError.message);
  }

  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePending, setProfilePending] = useState(false);

  async function hydrateUser(nextSession, fallbackData = {}) {
    if (!nextSession?.user || !supabase) {
      setSession(nextSession ?? null);
      setProfile(null);
      setProfilePending(false);
      setLoading(false);
      return;
    }

    setSession(nextSession);
    setLoading(true);

    const existingProfile = await fetchProfile(nextSession.user.id);

    if (existingProfile) {
      setProfile(existingProfile);
      setProfilePending(false);
      setLoading(false);
      return;
    }

    const autoCreatedProfile = await createClientProfile(nextSession.user, fallbackData);

    if (autoCreatedProfile) {
      setProfile(autoCreatedProfile);
      setProfilePending(false);
      setLoading(false);
      return;
    }

    setProfile(null);
    setProfilePending(true);
    setLoading(false);
  }

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

      await hydrateUser(currentSession ?? null);

      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        await hydrateUser(nextSession ?? null);
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
      profilePending,
      isSupabaseConfigured,
      supabaseConfigError,
      getRoleHomePath,
      refreshProfile: async () => {
        if (!session?.user?.id) return null;
        const refreshed = await fetchProfile(session.user.id);
        setProfile(refreshed);
        setProfilePending(!refreshed);
        return refreshed;
      },
      signIn: async ({ email, password }) => {
        if (!supabase) {
          return { error: new Error(supabaseConfigError) };
        }

        const result = await supabase.auth.signInWithPassword({ email, password });
        return result;
      },
      signUpClient: async ({ firstName, lastName, email, phone, password }) => {
        if (!supabase) {
          return { error: new Error(supabaseConfigError) };
        }

        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: phone || null,
              requested_role: 'client',
            },
          },
        });

        if (result.data?.session) {
          await hydrateUser(result.data.session, { firstName, lastName, phone });
        }

        return result;
      },
      resetPassword: async (email) => {
        if (!supabase) {
          return { error: new Error(supabaseConfigError) };
        }

        return supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
      },
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setProfilePending(false);
      },
    }),
    [loading, profile, profilePending, session]
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
