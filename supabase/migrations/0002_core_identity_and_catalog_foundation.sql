create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role_enum not null,
  account_status public.account_status_enum not null default 'active',
  email text not null unique,
  first_name text null,
  last_name text null,
  phone text null,
  referral_code text null unique,
  referred_by_user_id uuid null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create table public.client_addresses (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references public.profiles(user_id) on delete cascade,
  label text not null,
  address_line_1 text not null,
  address_line_2 text null,
  postal_code text not null,
  city text not null,
  country_code text not null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  establishment_type public.establishment_type_enum not null,
  legal_name text not null,
  display_name text not null,
  description text null,
  logo_url text null,
  cover_image_url text null,
  opening_hours jsonb null,
  minimum_order_cents integer not null default 0 check (minimum_order_cents >= 0),
  is_halal boolean not null default false,
  siret text not null,
  address_line_1 text not null,
  address_line_2 text null,
  postal_code text not null,
  city text not null,
  country_code text not null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  validation_status public.partner_validation_status_enum not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by_admin_user_id uuid null references public.profiles(user_id),
  rc_pro_due_at timestamptz not null,
  rc_pro_received_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.partners is 'Private source table. MVP: 1 partner = 1 establishment. Public client exposure must go through partner_public_view only.';
comment on column public.partners.siret is 'SIRET number entered by the partner. This is distinct from partner_documents(document_type = siret), which stores the supporting proof file if required.';

create table public.partner_documents (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  document_type public.partner_document_type_enum not null,
  storage_path text not null,
  verification_status public.partner_document_status_enum not null default 'pending_review',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by_admin_user_id uuid null references public.profiles(user_id),
  rejection_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_documents_partner_type_unique unique (partner_id, document_type)
);

comment on column public.partner_documents.storage_path is 'Private storage path. Partner documents must stay private.';
comment on column public.partner_documents.document_type is 'document_type = siret stores a supporting proof file when required. It is not the textual SIRET number itself.';

create table public.couriers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  validation_status public.courier_validation_status_enum not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by_admin_user_id uuid null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courier_availabilities (
  id uuid primary key default gen_random_uuid(),
  courier_id uuid not null references public.couriers(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courier_availabilities_time_check check (ends_at > starts_at)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  establishment_type public.establishment_type_enum not null,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
