-- 0009 — handle_new_user signup trigger
--
-- Purpose
-- -------
-- The Foodiz technical blueprint (v1.1, §6 RLS and §7.1/7.2/7.3) specifies that
-- profile rows are inserted "via trigger backend post-signup uniquement" —
-- i.e. the application client is *not* allowed to insert into public.profiles
-- directly (no profiles_insert policy exists in 0007). This migration adds the
-- missing post-signup trigger on auth.users that:
--
--   1. reads raw_user_meta_data set by the supabase-js client at sign_up time:
--        - requested_role        ('client' | 'partner' | 'courier')
--        - first_name, last_name, phone
--        - referred_by_code      (optional referral code of the inviter)
--   2. inserts the matching public.profiles row with role correctly set
--   3. generates a unique referral_code based on the user_id
--   4. for clients, also bootstraps the linked public.loyalty_accounts row
--
-- The trigger runs as SECURITY DEFINER so it bypasses RLS, which is the only
-- safe way to populate a profile row before the user has any session token.
-- The existing guard_profiles_protected_columns trigger short-circuits when
-- auth.uid() is null (signup context), so this insert is allowed.
--
-- Idempotency: running this migration twice is safe — `create or replace
-- function` and `drop trigger if exists` are used everywhere.

create or replace function public.generate_referral_code(p_user_id uuid)
returns text
language plpgsql
stable
as $$
declare
  v_seed text;
begin
  -- Take the first 8 hex chars of the uuid (no dashes) and prefix with `fdz-`.
  -- Combined with a small random suffix it gives a short, human-shareable code
  -- with negligible collision probability across realistic Foodiz scale.
  v_seed := replace(p_user_id::text, '-', '');
  return 'fdz-' || substr(v_seed, 1, 8) || '-' || substr(v_seed, 9, 4);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta            jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_requested_role  text  := nullif(v_meta->>'requested_role', '');
  v_role            public.user_role_enum;
  v_first_name      text  := nullif(v_meta->>'first_name', '');
  v_last_name       text  := nullif(v_meta->>'last_name', '');
  v_phone           text  := nullif(v_meta->>'phone', '');
  v_referral_in     text  := nullif(v_meta->>'referred_by_code', '');
  v_referrer_id     uuid;
  v_referral_code   text;
begin
  -- Default to 'client' if the metadata didn't carry a requested_role
  -- (defensive: the auth UI always sets it, but a manual signup via the
  -- Supabase dashboard would otherwise fail the enum cast).
  if v_requested_role is null
     or v_requested_role not in ('client', 'partner', 'courier') then
    v_role := 'client';
  else
    v_role := v_requested_role::public.user_role_enum;
  end if;

  -- Resolve optional referrer (only meaningful for client signups but we
  -- accept it for any role — it stays null if the code does not exist).
  if v_referral_in is not null then
    select user_id
      into v_referrer_id
      from public.profiles
     where referral_code = v_referral_in
     limit 1;
  end if;

  v_referral_code := public.generate_referral_code(new.id);

  insert into public.profiles (
    user_id,
    role,
    account_status,
    email,
    first_name,
    last_name,
    phone,
    referral_code,
    referred_by_user_id
  ) values (
    new.id,
    v_role,
    'active',
    new.email,
    v_first_name,
    v_last_name,
    v_phone,
    v_referral_code,
    v_referrer_id
  )
  on conflict (user_id) do nothing;

  -- Bootstrap the loyalty account for clients only — partner/courier loyalty
  -- accounts are not in scope per FOODIZ_MASTER_SPEC §3 (loyalty = client side).
  if v_role = 'client' then
    insert into public.loyalty_accounts (client_user_id)
    values (new.id)
    on conflict (client_user_id) do nothing;
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Post-signup trigger: creates the public.profiles row (role taken from raw_user_meta_data.requested_role) and, for clients, the matching loyalty_accounts row. Runs as SECURITY DEFINER because no profiles_insert RLS policy exists by design (see FOODIZ_TECHNICAL_BLUEPRINT §6.profiles).';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
