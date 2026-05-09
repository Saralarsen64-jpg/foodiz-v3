create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.user_role_enum as enum (
  'client',
  'partner',
  'courier',
  'admin'
);

create type public.account_status_enum as enum (
  'active',
  'suspended',
  'deleted'
);

create type public.establishment_type_enum as enum (
  'restaurant',
  'market'
);

create type public.partner_validation_status_enum as enum (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

create type public.courier_validation_status_enum as enum (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

create type public.partner_document_type_enum as enum (
  'siret',
  'identity_document',
  'kbis',
  'rc_pro'
);

create type public.partner_document_status_enum as enum (
  'pending_review',
  'approved',
  'rejected'
);

create type public.product_status_enum as enum (
  'active',
  'inactive'
);

create type public.cart_status_enum as enum (
  'active',
  'converted',
  'expired'
);

create type public.order_status_enum as enum (
  'pending_payment',
  'paid',
  'in_preparation',
  'ready_for_pickup',
  'courier_assigned',
  'picked_up',
  'delivered',
  'cancelled'
);

create type public.payment_status_enum as enum (
  'pending',
  'succeeded',
  'failed',
  'cancelled'
);

create type public.delivery_status_enum as enum (
  'pending_assignment',
  'courier_assigned',
  'picked_up',
  'delivered',
  'cancelled'
);

create type public.delivery_fee_model_enum as enum (
  'zone_fixed',
  'zone_distance_variable'
);

create type public.loyalty_source_enum as enum (
  'order',
  'partner_review',
  'courier_review',
  'satisfaction_response'
);

create type public.referral_status_enum as enum (
  'pending',
  'rewarded',
  'cancelled'
);

create type public.device_platform_enum as enum (
  'ios',
  'android',
  'web'
);

create type public.notification_pack_type_enum as enum (
  'discovery',
  'boost',
  'performance'
);

create type public.notification_campaign_status_enum as enum (
  'draft',
  'generated',
  'sent',
  'cancelled'
);

create type public.notification_credit_source_enum as enum (
  'pack_purchase',
  'campaign_consumption'
);

create type public.notification_message_type_enum as enum (
  'transactional',
  'partner_campaign'
);

create type public.notification_dispatch_status_enum as enum (
  'pending',
  'sent',
  'failed'
);

create type public.payout_status_enum as enum (
  'pending',
  'paid',
  'cancelled'
);

comment on type public.establishment_type_enum is 'Foodiz supports only restaurant and market. No sweet_night, market_day or market_night.';
comment on type public.notification_pack_type_enum is 'Technical mapping: discovery = Découverte, boost = Boost, performance = Performance.';
comment on type public.order_status_enum is 'Foodiz economic model remains calculated per article, never at restaurant or basket-global rule level.';
