create table public.loyalty_accounts (
  client_user_id uuid primary key references public.profiles(user_id) on delete cascade,
  points_balance integer not null default 0,
  total_points_earned integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partner_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  client_user_id uuid not null references public.profiles(user_id),
  partner_id uuid not null references public.partners(id),
  rating smallint not null check (rating between 1 and 5),
  comment text null,
  created_at timestamptz not null default now()
);

create table public.courier_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  client_user_id uuid not null references public.profiles(user_id),
  courier_id uuid not null references public.couriers(id),
  rating smallint not null check (rating between 1 and 5),
  comment text null,
  created_at timestamptz not null default now()
);

create table public.satisfaction_responses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  client_user_id uuid not null references public.profiles(user_id),
  response_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references public.profiles(user_id) on delete cascade,
  source public.loyalty_source_enum not null,
  order_id uuid null unique references public.orders(id),
  partner_review_id uuid null unique references public.partner_reviews(id),
  courier_review_id uuid null unique references public.courier_reviews(id),
  satisfaction_response_id uuid null unique references public.satisfaction_responses(id),
  points integer not null check (points > 0),
  created_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles(user_id),
  referred_user_id uuid not null unique references public.profiles(user_id),
  status public.referral_status_enum not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referrals_no_self_referral_check check (referrer_user_id <> referred_user_id)
);

create table public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  platform public.device_platform_enum not null,
  push_token text not null unique,
  is_active boolean not null default true,
  last_seen_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partner_notification_pack_purchases (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  pack_type public.notification_pack_type_enum not null,
  campaigns_included integer not null check (campaigns_included > 0),
  amount_cents integer not null check (amount_cents >= 0),
  stripe_payment_intent_id text not null unique,
  payment_status public.payment_status_enum not null default 'pending',
  purchased_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.partner_notification_pack_purchases is 'Pack mapping: discovery = Découverte, boost = Boost, performance = Performance.';

create table public.partner_notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  status public.notification_campaign_status_enum not null default 'draft',
  generated_content text not null,
  tone_locked boolean not null default true,
  credits_consumed integer not null default 1 check (credits_consumed = 1),
  ai_score numeric(5,2) null,
  gourmandise_score numeric(5,2) null,
  elegance_score numeric(5,2) null,
  clarity_score numeric(5,2) null,
  soft_conversion_score numeric(5,2) null,
  context_relevance_score numeric(5,2) null,
  brand_safety_score numeric(5,2) null,
  ai_score_details jsonb null,
  sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_notification_campaign_scores_range_check check (
    (ai_score is null or (ai_score >= 0 and ai_score <= 100))
    and (gourmandise_score is null or (gourmandise_score >= 0 and gourmandise_score <= 100))
    and (elegance_score is null or (elegance_score >= 0 and elegance_score <= 100))
    and (clarity_score is null or (clarity_score >= 0 and clarity_score <= 100))
    and (soft_conversion_score is null or (soft_conversion_score >= 0 and soft_conversion_score <= 100))
    and (context_relevance_score is null or (context_relevance_score >= 0 and context_relevance_score <= 100))
    and (brand_safety_score is null or (brand_safety_score >= 0 and brand_safety_score <= 100))
  )
);

create table public.partner_notification_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  source_type public.notification_credit_source_enum not null,
  pack_purchase_id uuid null references public.partner_notification_pack_purchases(id),
  campaign_id uuid null references public.partner_notification_campaigns(id),
  delta_credits integer not null check (delta_credits <> 0),
  balance_after integer not null check (balance_after >= 0),
  created_at timestamptz not null default now(),
  constraint partner_notification_credit_ledger_source_exclusive_check check (
    (source_type = 'pack_purchase' and pack_purchase_id is not null and campaign_id is null)
    or
    (source_type = 'campaign_consumption' and campaign_id is not null and pack_purchase_id is null)
  )
);

create table public.notification_dispatches (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(user_id) on delete cascade,
  message_type public.notification_message_type_enum not null,
  campaign_id uuid null references public.partner_notification_campaigns(id) on delete set null,
  device_id uuid null references public.notification_devices(id) on delete set null,
  message_body text not null,
  status public.notification_dispatch_status_enum not null default 'pending',
  provider_message_id text null,
  error_message text null,
  dispatched_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  period_start timestamptz not null,
  period_end timestamptz not null,
  status public.payout_status_enum not null default 'pending',
  external_reference text null,
  processed_by_admin_user_id uuid null references public.profiles(user_id),
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_payouts_period_check check (period_end >= period_start)
);

create table public.courier_payouts (
  id uuid primary key default gen_random_uuid(),
  courier_id uuid not null references public.couriers(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  period_start timestamptz not null,
  period_end timestamptz not null,
  status public.payout_status_enum not null default 'pending',
  external_reference text null,
  processed_by_admin_user_id uuid null references public.profiles(user_id),
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courier_payouts_period_check check (period_end >= period_start)
);

create table public.account_suspensions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  reason text not null,
  imposed_by_admin_user_id uuid null references public.profiles(user_id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(user_id),
  action_type text not null,
  target_table text not null,
  target_id uuid null,
  payload jsonb null,
  created_at timestamptz not null default now()
);

create table public.domain_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  source text not null,
  idempotency_key text null unique,
  payload jsonb not null,
  emitted_at timestamptz not null default now(),
  processed_at timestamptz null
);
