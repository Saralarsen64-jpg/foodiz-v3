import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase, supabaseConfigError } from '../../lib/supabaseClient';

const AuthContext = createContext(null);

const PROFILE_FETCH_RETRIES = 6;
const PROFILE_FETCH_RETRY_DELAY_MS = 350;
const ALLOWED_SIGNUP_ROLES = ['client', 'partner', 'courier'];

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reads a profile by user_id. Profiles are created by the post-signup trigger
 * (`public.handle_new_user`, migration 0009), so right after signUp we may
 * race the trigger — we retry a few times before giving up.
 */
async function fetchProfileWithRetry(userId, { retries = PROFILE_FETCH_RETRIES } = {}) {
  if (!supabase || !userId) return null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, first_name, last_name, phone, role, account_status, referral_code')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Permission / network errors don't usually self-heal — bail early.
      console.warn('[Foodiz] Lecture profil échouée.', error.message);
      return null;
    }

    if (data) return data;

    if (attempt < retries) {
      await sleep(PROFILE_FETCH_RETRY_DELAY_MS);
    }
  }

  return null;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePending, setProfilePending] = useState(false);
  // True when the active session corresponds to a Supabase password-recovery
  // link — the UI uses this to render the dedicated "set new password" screen
  // and to keep the session out of role-based redirection until the user has
  // chosen a new password.
  const [recoveryMode, setRecoveryMode] = useState(false);

  // Guards against state updates after unmount during the bootstrap effect.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hydrateUser = useCallback(async (nextSession) => {
    if (!supabase || !nextSession?.user) {
      if (!mountedRef.current) return;
      setSession(nextSession ?? null);
      setProfile(null);
      setProfilePending(false);
      setLoading(false);
      return;
    }

    if (mountedRef.current) {
      setSession(nextSession);
      setLoading(true);
      setLoading(false);
    }

    const fetched = await fetchProfileWithRetry(nextSession.user.id);

    if (!mountedRef.current) return;

    if (fetched) {
      setProfile(fetched);
      setProfilePending(false);
    } else {
      setProfile(null);
      setProfilePending(false);
    }
    setLoading(false);
  }, []);

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
      } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        // Supabase emits PASSWORD_RECOVERY when the user lands from a
        // reset-password email link. We flip the recoveryMode flag so the
        // /auth/reset-password screen takes over instead of the normal
        // role-redirect logic; the flag clears when the user signs out or
        // successfully updates their password (see updatePassword below).
        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryMode(true);
        }
        if (event === 'SIGNED_OUT') {
          setRecoveryMode(false);
        }
        await hydrateUser(nextSession ?? null);
      });

      subscription = authSubscription;
    }

    bootstrap();

    return () => {
      subscription?.unsubscribe();
    };
  }, [hydrateUser]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return null;
    const refreshed = await fetchProfileWithRetry(session.user.id, { retries: 2 });
    if (!mountedRef.current) return refreshed;
    setProfile(refreshed);
    setProfilePending(!refreshed);
    return refreshed;
  }, [session?.user?.id]);

  /**
   * Generic role-aware signup. The role is passed in raw_user_meta_data
   * (`requested_role`) and consumed by the `handle_new_user` trigger which
   * inserts the public.profiles row server-side.
   *
   * For partner/courier the application is responsible for inserting the
   * matching public.partners / public.couriers row in a follow-up onboarding
   * step (see PartnerOnboardingPage / CourierOnboardingPage).
   */
  const signUp = useCallback(
    async ({ role, email, password, firstName, lastName, phone, referredByCode }) => {
      if (!supabase) return { error: new Error(supabaseConfigError) };

      const safeRole = ALLOWED_SIGNUP_ROLES.includes(role) ? role : 'client';

      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          // The redirect target only matters when "Confirm email" is on:
          // Supabase appends a token and bounces back to /auth which then
          // routes to the right onboarding flow once the role-bearing
          // profile row is loaded.
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            requested_role: safeRole,
            first_name: firstName ?? null,
            last_name: lastName ?? null,
            phone: phone ?? null,
            referred_by_code: referredByCode ?? null,
          },
        },
      });

      // If a session was returned (i.e. email confirmation is OFF in the
      // Supabase project) we eagerly hydrate the profile so the calling
      // page can navigate without waiting for onAuthStateChange.
      if (result?.data?.session) {
        await hydrateUser(result.data.session);
      }

      return result;
    },
    [hydrateUser]
  );

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      profilePending,
      recoveryMode,
      isSupabaseConfigured,
      supabaseConfigError,
      getRoleHomePath,
      refreshProfile,

      signIn: async ({ email, password }) => {
        if (!supabase) return { error: new Error(supabaseConfigError) };
        return supabase.auth.signInWithPassword({ email, password });
      },

      signUp,
      signUpClient: (payload) => signUp({ ...payload, role: 'client' }),
      signUpPartner: (payload) => signUp({ ...payload, role: 'partner' }),
      signUpCourier: (payload) => signUp({ ...payload, role: 'courier' }),

      resetPassword: async (email) => {
        if (!supabase) return { error: new Error(supabaseConfigError) };
        return supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
      },

      /**
       * Updates the password for a user currently in a recovery session.
       * Clears the local recoveryMode flag on success so the normal
       * role-based routing resumes.
       */
      updatePassword: async (newPassword) => {
        if (!supabase) return { error: new Error(supabaseConfigError) };
        const result = await supabase.auth.updateUser({ password: newPassword });
        if (!result.error) {
          setRecoveryMode(false);
        }
        return result;
      },

      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        if (!mountedRef.current) return;
        setSession(null);
        setProfile(null);
        setProfilePending(false);
        setRecoveryMode(false);
      },
    }),
    [loading, profile, profilePending, recoveryMode, refreshProfile, session, signUp]
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
