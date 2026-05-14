create table public.products (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  name text not null,
  description text null,
  image_url text null,
  partner_price_cents integer not null check (partner_price_cents >= 50),
  is_halal boolean not null default false,
  is_bestseller boolean not null default false,
  sort_order integer not null default 0,
  status public.product_status_enum not null default 'active',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references public.profiles(user_id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  delivery_address_id uuid null references public.client_addresses(id),
  status public.cart_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_partner_price_cents integer not null check (unit_partner_price_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  geojson jsonb not null,
  pricing_mode public.delivery_fee_model_enum not null default 'zone_fixed',
  min_distance_km numeric(6,2) null,
  max_distance_km numeric(6,2) null,
  base_fee_cents integer not null check (base_fee_cents >= 0),
  minimum_fee_cents integer not null default 0 check (minimum_fee_cents >= 0),
  per_km_cents integer null check (per_km_cents is null or per_km_cents >= 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_zones_distance_bounds_check check (
    max_distance_km is null
    or min_distance_km is null
    or max_distance_km >= min_distance_km
  )
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references public.profiles(user_id),
  partner_id uuid not null references public.partners(id),
  delivery_address_id uuid null references public.client_addresses(id) on delete set null,
  delivery_address_line_1 text not null,
  delivery_address_line_2 text null,
  delivery_postal_code text not null,
  delivery_city text not null,
  delivery_country_code text not null,
  delivery_latitude numeric(9,6) not null,
  delivery_longitude numeric(9,6) not null,
  cart_id uuid null unique references public.carts(id),
  delivery_zone_id uuid null references public.delivery_zones(id),
  order_status public.order_status_enum not null default 'pending_payment',
  item_count integer not null check (item_count > 0),
  subtotal_partner_cents integer not null check (subtotal_partner_cents >= 0),
  subtotal_customer_cents integer not null check (subtotal_customer_cents >= 0),
  total_markup_cents integer not null check (total_markup_cents >= 0),
  courier_share_cents integer not null check (courier_share_cents >= 0),
  foodiz_share_cents integer not null check (foodiz_share_cents >= 0),
  loyalty_funding_cents integer not null check (loyalty_funding_cents >= 0),
  referral_funding_cents integer not null check (referral_funding_cents >= 0),
  service_fee_cents integer not null check (service_fee_cents >= 0),
  delivery_fee_cents integer not null check (delivery_fee_cents >= 0),
  total_customer_cents integer not null check (total_customer_cents >= 0),
  distance_km numeric(6,2) null,
  placed_at timestamptz not null default now(),
  paid_at timestamptz null,
  delivered_at timestamptz null,
  cancelled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.orders.delivery_address_id is 'Nullable only to preserve historical order snapshots if the source client address is later deleted. Orders must be created from a real address snapshot.';
comment on column public.orders.item_count is 'Sum of order_items.quantity. Service fee is calculated from this total item count.';
comment on column public.orders.subtotal_partner_cents is 'Partner payout base. The partner gets the partner subtotal, not the client total.';
comment on column public.orders.courier_share_cents is 'Courier article-based share only. Final courier earning = courier_share_cents + delivery_fee_cents.';
comment on column public.orders.total_markup_cents is 'Foodiz keeps the cumulative markup according to the official article-based economic model.';
comment on column public.orders.service_fee_cents is 'Foodiz keeps the service fee according to the official service-fee brackets.';

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name_snapshot text not null,
  quantity integer not null check (quantity > 0),
  markup_bracket smallint not null check (markup_bracket in (1, 2, 3)),
  unit_partner_price_cents integer not null check (unit_partner_price_cents >= 0),
  unit_markup_cents integer not null check (unit_markup_cents >= 0),
  unit_customer_price_cents integer not null check (unit_customer_price_cents >= 0),
  unit_courier_share_cents integer not null check (unit_courier_share_cents >= 0),
  unit_foodiz_share_cents integer not null check (unit_foodiz_share_cents >= 0),
  unit_loyalty_funding_cents integer not null check (unit_loyalty_funding_cents >= 0),
  unit_referral_funding_cents integer not null check (unit_referral_funding_cents >= 0),
  line_partner_subtotal_cents integer not null check (line_partner_subtotal_cents >= 0),
  line_customer_subtotal_cents integer not null check (line_customer_subtotal_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  stripe_payment_intent_id text not null unique,
  amount_cents integer not null check (amount_cents >= 0),
  currency_code char(3) not null default 'EUR',
  status public.payment_status_enum not null default 'pending',
  paid_at timestamptz null,
  failed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  courier_id uuid null references public.couriers(id),
  status public.delivery_status_enum not null default 'pending_assignment',
  accepted_at timestamptz null,
  pickup_confirmed_at timestamptz null,
  delivered_at timestamptz null,
  client_confirmed_at timestamptz null,
  proof_image_url text null,
  delivery_notes text null,
  last_courier_lat numeric(9,6) null,
  last_courier_lng numeric(9,6) null,
  last_location_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.deliveries is 'Delivery lifecycle remains driven by courier assignment, pickup confirmation and delivery confirmation. Optional proof and client_confirmed_at do not change the official MVP lifecycle.';
