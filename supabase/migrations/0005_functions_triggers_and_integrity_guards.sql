create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role_enum
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
      and p.account_status = 'active'
  );
$$;

create or replace function public.is_client()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'client'
      and p.account_status = 'active'
  );
$$;

create or replace function public.is_partner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'partner'
      and p.account_status = 'active'
  );
$$;

create or replace function public.is_courier()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'courier'
      and p.account_status = 'active'
  );
$$;

create or replace function public.owns_partner(p_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.partners p
    where p.id = p_partner_id
      and p.user_id = auth.uid()
  );
$$;

create or replace function public.owns_courier(p_courier_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couriers c
    where c.id = p_courier_id
      and c.user_id = auth.uid()
  );
$$;

create or replace function public.owns_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and o.client_user_id = auth.uid()
  );
$$;

create or replace function public.storage_partner_id_from_object_name(p_name text)
returns uuid
language plpgsql
stable
as $$
declare
  v_parts text[];
  v_candidate text;
begin
  v_parts := string_to_array(p_name, '/');

  if array_length(v_parts, 1) <> 4 then
    return null;
  end if;

  if v_parts[1] <> 'partners' then
    return null;
  end if;

  v_candidate := v_parts[2];

  if v_candidate ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return v_candidate::uuid;
  end if;

  return null;
end;
$$;

create or replace function public.storage_partner_document_path_is_valid(p_name text)
returns boolean
language sql
stable
as $$
  select p_name ~* '^partners/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/(siret|identity_document|kbis|rc_pro)/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[A-Za-z0-9]+$';
$$;

create or replace function public.assert_profile_role(p_user_id uuid, p_expected_role public.user_role_enum)
returns void
language plpgsql
as $$
declare
  v_actual_role public.user_role_enum;
begin
  select p.role into v_actual_role
  from public.profiles p
  where p.user_id = p_user_id;

  if v_actual_role is null then
    raise exception 'Profile % not found for expected role %', p_user_id, p_expected_role;
  end if;

  if v_actual_role <> p_expected_role then
    raise exception 'Profile % must have role %, got %', p_user_id, p_expected_role, v_actual_role;
  end if;
end;
$$;

create or replace function public.guard_profile_role_fk()
returns trigger
language plpgsql
as $$
declare
  v_column_name text := tg_argv[0];
  v_expected_role public.user_role_enum := tg_argv[1]::public.user_role_enum;
  v_user_id_text text;
begin
  v_user_id_text := to_jsonb(new) ->> v_column_name;

  if v_user_id_text is null then
    return new;
  end if;

  perform public.assert_profile_role(v_user_id_text::uuid, v_expected_role);
  return new;
end;
$$;

create or replace function public.guard_profiles_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if old.user_id <> auth.uid() then
    raise exception 'Not allowed to update this profile';
  end if;

  if new.user_id is distinct from old.user_id
     or new.role is distinct from old.role
     or new.account_status is distinct from old.account_status
     or new.email is distinct from old.email
     or new.referral_code is distinct from old.referral_code
     or new.referred_by_user_id is distinct from old.referred_by_user_id
     or new.deleted_at is distinct from old.deleted_at then
    raise exception 'Protected profile fields cannot be updated directly';
  end if;

  return new;
end;
$$;

create or replace function public.guard_partners_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if old.user_id <> auth.uid() then
    raise exception 'Not allowed to update this partner';
  end if;

  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.validation_status is distinct from old.validation_status
     or new.reviewed_at is distinct from old.reviewed_at
     or new.reviewed_by_admin_user_id is distinct from old.reviewed_by_admin_user_id
     or new.rc_pro_due_at is distinct from old.rc_pro_due_at
     or new.rc_pro_received_at is distinct from old.rc_pro_received_at then
    raise exception 'Protected partner fields cannot be updated directly';
  end if;

  return new;
end;
$$;

create or replace function public.guard_couriers_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if old.user_id <> auth.uid() then
    raise exception 'Not allowed to update this courier';
  end if;

  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.validation_status is distinct from old.validation_status
     or new.reviewed_at is distinct from old.reviewed_at
     or new.reviewed_by_admin_user_id is distinct from old.reviewed_by_admin_user_id then
    raise exception 'Protected courier fields cannot be updated directly';
  end if;

  return new;
end;
$$;

create or replace function public.guard_partner_documents_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner_user_id uuid;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  select p.user_id into v_partner_user_id
  from public.partners p
  where p.id = old.partner_id;

  if v_partner_user_id is null or v_partner_user_id <> auth.uid() then
    raise exception 'Not allowed to update this partner document';
  end if;

  if new.id is distinct from old.id
     or new.partner_id is distinct from old.partner_id
     or new.document_type is distinct from old.document_type then
    raise exception 'Partner document identity fields cannot be changed';
  end if;

  if new.storage_path is distinct from old.storage_path then
    new.verification_status = 'pending_review';
    new.reviewed_at = null;
    new.reviewed_by_admin_user_id = null;
    new.rejection_reason = null;
    new.submitted_at = now();
  else
    if new.verification_status is distinct from old.verification_status
       or new.reviewed_at is distinct from old.reviewed_at
       or new.reviewed_by_admin_user_id is distinct from old.reviewed_by_admin_user_id
       or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'Partner cannot update document review fields directly';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_product_category_partner_type()
returns trigger
language plpgsql
as $$
declare
  v_partner_type public.establishment_type_enum;
  v_category_type public.establishment_type_enum;
begin
  select p.establishment_type into v_partner_type
  from public.partners p
  where p.id = new.partner_id;

  select c.establishment_type into v_category_type
  from public.categories c
  where c.id = new.category_id;

  if v_partner_type is null then
    raise exception 'Partner not found for product';
  end if;

  if v_category_type is null then
    raise exception 'Category not found for product';
  end if;

  if v_partner_type <> v_category_type then
    raise exception 'Product category establishment_type must match partner establishment_type';
  end if;

  return new;
end;
$$;

create or replace function public.validate_cart_item_partner_consistency()
returns trigger
language plpgsql
as $$
declare
  v_cart_partner_id uuid;
  v_product_partner_id uuid;
begin
  select c.partner_id into v_cart_partner_id
  from public.carts c
  where c.id = new.cart_id;

  select p.partner_id into v_product_partner_id
  from public.products p
  where p.id = new.product_id;

  if v_cart_partner_id is null then
    raise exception 'Cart not found';
  end if;

  if v_product_partner_id is null then
    raise exception 'Product not found';
  end if;

  if v_cart_partner_id <> v_product_partner_id then
    raise exception 'All cart items must belong to the cart partner';
  end if;

  return new;
end;
$$;

create or replace function public.validate_cart_delivery_address_ownership()
returns trigger
language plpgsql
as $$
declare
  v_address_owner uuid;
begin
  if new.delivery_address_id is null then
    return new;
  end if;

  select a.client_user_id into v_address_owner
  from public.client_addresses a
  where a.id = new.delivery_address_id;

  if v_address_owner is null then
    raise exception 'Delivery address not found';
  end if;

  if v_address_owner <> new.client_user_id then
    raise exception 'Cart delivery address must belong to the cart client';
  end if;

  return new;
end;
$$;

create or replace function public.validate_order_cart_and_address_consistency()
returns trigger
language plpgsql
as $$
declare
  v_address public.client_addresses%rowtype;
  v_cart public.carts%rowtype;
begin
  if tg_op = 'INSERT' then
    if new.delivery_address_id is null then
      raise exception 'Order creation requires delivery_address_id to populate the delivery snapshot';
    end if;

    select * into v_address
    from public.client_addresses a
    where a.id = new.delivery_address_id;

    if v_address.id is null then
      raise exception 'Order delivery address not found';
    end if;

    if v_address.client_user_id <> new.client_user_id then
      raise exception 'Order delivery address must belong to the order client';
    end if;

    new.delivery_address_line_1 := v_address.address_line_1;
    new.delivery_address_line_2 := v_address.address_line_2;
    new.delivery_postal_code := v_address.postal_code;
    new.delivery_city := v_address.city;
    new.delivery_country_code := v_address.country_code;
    new.delivery_latitude := v_address.latitude;
    new.delivery_longitude := v_address.longitude;
  elsif tg_op = 'UPDATE' then
    if new.delivery_address_id is distinct from old.delivery_address_id then
      raise exception 'delivery_address_id cannot be modified after order creation';
    end if;

    if new.delivery_address_line_1 is distinct from old.delivery_address_line_1
       or new.delivery_address_line_2 is distinct from old.delivery_address_line_2
       or new.delivery_postal_code is distinct from old.delivery_postal_code
       or new.delivery_city is distinct from old.delivery_city
       or new.delivery_country_code is distinct from old.delivery_country_code
       or new.delivery_latitude is distinct from old.delivery_latitude
       or new.delivery_longitude is distinct from old.delivery_longitude then
      raise exception 'Delivery address snapshot fields cannot be modified after order creation';
    end if;
  end if;

  if new.cart_id is not null then
    select * into v_cart
    from public.carts c
    where c.id = new.cart_id;

    if v_cart.id is null then
      raise exception 'Order cart not found';
    end if;

    if v_cart.client_user_id <> new.client_user_id then
      raise exception 'Order cart must belong to the same client as the order';
    end if;

    if v_cart.partner_id <> new.partner_id then
      raise exception 'Order cart must belong to the same partner as the order';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.foodiz_bracket_from_partner_price_cents(p_partner_price_cents integer)
returns smallint
language sql
immutable
as $$
  select case
    when p_partner_price_cents between 50 and 350 then 1
    when p_partner_price_cents between 351 and 849 then 2
    when p_partner_price_cents >= 850 then 3
    else null
  end;
$$;

create or replace function public.foodiz_markup_from_partner_price_cents(p_partner_price_cents integer)
returns integer
language sql
immutable
as $$
  select case
    when p_partner_price_cents between 50 and 350 then 100
    when p_partner_price_cents between 351 and 849 then 250
    when p_partner_price_cents >= 850 then 300
    else null
  end;
$$;

create or replace function public.foodiz_courier_share_from_partner_price_cents(p_partner_price_cents integer)
returns integer
language sql
immutable
as $$
  select case
    when p_partner_price_cents between 50 and 350 then 50
    when p_partner_price_cents between 351 and 849 then 100
    when p_partner_price_cents >= 850 then 100
    else null
  end;
$$;

create or replace function public.foodiz_foodiz_share_from_partner_price_cents(p_partner_price_cents integer)
returns integer
language sql
immutable
as $$
  select case
    when p_partner_price_cents between 50 and 350 then 50
    when p_partner_price_cents between 351 and 849 then 100
    when p_partner_price_cents >= 850 then 150
    else null
  end;
$$;

create or replace function public.foodiz_loyalty_funding_from_partner_price_cents(p_partner_price_cents integer)
returns integer
language sql
immutable
as $$
  select case
    when p_partner_price_cents between 50 and 350 then 0
    when p_partner_price_cents between 351 and 849 then 20
    when p_partner_price_cents >= 850 then 20
    else null
  end;
$$;

create or replace function public.foodiz_referral_funding_from_partner_price_cents(p_partner_price_cents integer)
returns integer
language sql
immutable
as $$
  select case
    when p_partner_price_cents between 50 and 350 then 0
    when p_partner_price_cents between 351 and 849 then 30
    when p_partner_price_cents >= 850 then 30
    else null
  end;
$$;

create or replace function public.foodiz_service_fee_from_item_count(p_item_count integer)
returns integer
language sql
immutable
as $$
  select case
    when p_item_count = 1 then 199
    when p_item_count = 2 then 149
    when p_item_count = 3 then 119
    when p_item_count >= 4 then 99
    else null
  end;
$$;

create or replace function public.validate_order_item_partner_consistency()
returns trigger
language plpgsql
as $$
declare
  v_order_partner_id uuid;
  v_product_partner_id uuid;
begin
  select o.partner_id into v_order_partner_id
  from public.orders o
  where o.id = new.order_id;

  select p.partner_id into v_product_partner_id
  from public.products p
  where p.id = new.product_id;

  if v_order_partner_id is null then
    raise exception 'Order not found for order item';
  end if;

  if v_product_partner_id is null then
    raise exception 'Product not found for order item';
  end if;

  if v_order_partner_id <> v_product_partner_id then
    raise exception 'Order item product must belong to the same partner as the order';
  end if;

  return new;
end;
$$;

create or replace function public.validate_order_item_foodiz_pricing()
returns trigger
language plpgsql
as $$
declare
  v_expected_bracket smallint;
  v_expected_markup integer;
  v_expected_customer_price integer;
  v_expected_courier_share integer;
  v_expected_foodiz_share integer;
  v_expected_loyalty_funding integer;
  v_expected_referral_funding integer;
begin
  v_expected_bracket := public.foodiz_bracket_from_partner_price_cents(new.unit_partner_price_cents);
  v_expected_markup := public.foodiz_markup_from_partner_price_cents(new.unit_partner_price_cents);
  v_expected_customer_price := new.unit_partner_price_cents + v_expected_markup;
  v_expected_courier_share := public.foodiz_courier_share_from_partner_price_cents(new.unit_partner_price_cents);
  v_expected_foodiz_share := public.foodiz_foodiz_share_from_partner_price_cents(new.unit_partner_price_cents);
  v_expected_loyalty_funding := public.foodiz_loyalty_funding_from_partner_price_cents(new.unit_partner_price_cents);
  v_expected_referral_funding := public.foodiz_referral_funding_from_partner_price_cents(new.unit_partner_price_cents);

  if v_expected_bracket is null then
    raise exception 'Order item partner price is outside official Foodiz article pricing brackets';
  end if;

  if new.markup_bracket <> v_expected_bracket then
    raise exception 'Order item markup_bracket must match official Foodiz bracket';
  end if;

  if new.unit_markup_cents <> v_expected_markup then
    raise exception 'Order item unit_markup_cents must match official Foodiz markup';
  end if;

  if new.unit_customer_price_cents <> v_expected_customer_price then
    raise exception 'Order item unit_customer_price_cents must equal unit_partner_price_cents + unit_markup_cents';
  end if;

  if new.unit_courier_share_cents <> v_expected_courier_share then
    raise exception 'Order item unit_courier_share_cents must match official Foodiz share';
  end if;

  if new.unit_foodiz_share_cents <> v_expected_foodiz_share then
    raise exception 'Order item unit_foodiz_share_cents must match official Foodiz share';
  end if;

  if new.unit_loyalty_funding_cents <> v_expected_loyalty_funding then
    raise exception 'Order item unit_loyalty_funding_cents must match official Foodiz funding';
  end if;

  if new.unit_referral_funding_cents <> v_expected_referral_funding then
    raise exception 'Order item unit_referral_funding_cents must match official Foodiz funding';
  end if;

  if new.line_partner_subtotal_cents <> new.quantity * new.unit_partner_price_cents then
    raise exception 'Order item line_partner_subtotal_cents must equal quantity * unit_partner_price_cents';
  end if;

  if new.line_customer_subtotal_cents <> new.quantity * new.unit_customer_price_cents then
    raise exception 'Order item line_customer_subtotal_cents must equal quantity * unit_customer_price_cents';
  end if;

  return new;
end;
$$;

create or replace function public.validate_order_totals_for_order_id(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  v_order public.orders%rowtype;
  v_item_count integer;
  v_subtotal_partner integer;
  v_subtotal_customer integer;
  v_total_markup integer;
  v_courier_share integer;
  v_foodiz_share integer;
  v_loyalty_funding integer;
  v_referral_funding integer;
  v_expected_service_fee integer;
begin
  select * into v_order
  from public.orders o
  where o.id = p_order_id;

  if v_order.id is null then
    return;
  end if;

  select
    coalesce(sum(oi.quantity), 0)::integer,
    coalesce(sum(oi.line_partner_subtotal_cents), 0)::integer,
    coalesce(sum(oi.line_customer_subtotal_cents), 0)::integer,
    coalesce(sum(oi.quantity * oi.unit_markup_cents), 0)::integer,
    coalesce(sum(oi.quantity * oi.unit_courier_share_cents), 0)::integer,
    coalesce(sum(oi.quantity * oi.unit_foodiz_share_cents), 0)::integer,
    coalesce(sum(oi.quantity * oi.unit_loyalty_funding_cents), 0)::integer,
    coalesce(sum(oi.quantity * oi.unit_referral_funding_cents), 0)::integer
  into
    v_item_count,
    v_subtotal_partner,
    v_subtotal_customer,
    v_total_markup,
    v_courier_share,
    v_foodiz_share,
    v_loyalty_funding,
    v_referral_funding
  from public.order_items oi
  where oi.order_id = p_order_id;

  if v_item_count <= 0 then
    raise exception 'Order % must contain at least one order item', p_order_id;
  end if;

  v_expected_service_fee := public.foodiz_service_fee_from_item_count(v_item_count);

  if v_order.item_count <> v_item_count then
    raise exception 'Order % item_count must equal the sum of order_items.quantity', p_order_id;
  end if;

  if v_order.subtotal_partner_cents <> v_subtotal_partner then
    raise exception 'Order % subtotal_partner_cents must equal the sum of order item partner subtotals', p_order_id;
  end if;

  if v_order.subtotal_customer_cents <> v_subtotal_customer then
    raise exception 'Order % subtotal_customer_cents must equal the sum of order item customer subtotals', p_order_id;
  end if;

  if v_order.total_markup_cents <> v_total_markup then
    raise exception 'Order % total_markup_cents must equal the sum of item markups', p_order_id;
  end if;

  if v_total_markup <> (v_courier_share + v_foodiz_share + v_loyalty_funding + v_referral_funding) then
    raise exception 'Order % total markup must equal courier + Foodiz + loyalty + referral funding', p_order_id;
  end if;

  if v_order.courier_share_cents <> v_courier_share then
    raise exception 'Order % courier_share_cents must equal the sum of item courier shares', p_order_id;
  end if;

  if v_order.foodiz_share_cents <> v_foodiz_share then
    raise exception 'Order % foodiz_share_cents must equal the sum of item Foodiz shares', p_order_id;
  end if;

  if v_order.loyalty_funding_cents <> v_loyalty_funding then
    raise exception 'Order % loyalty_funding_cents must equal the sum of item loyalty funding', p_order_id;
  end if;

  if v_order.referral_funding_cents <> v_referral_funding then
    raise exception 'Order % referral_funding_cents must equal the sum of item referral funding', p_order_id;
  end if;

  if v_order.service_fee_cents <> v_expected_service_fee then
    raise exception 'Order % service_fee_cents must match the official Foodiz service fee for item_count %', p_order_id, v_item_count;
  end if;

  if v_order.subtotal_customer_cents <> (v_order.subtotal_partner_cents + v_order.total_markup_cents) then
    raise exception 'Order % subtotal_customer_cents must equal subtotal_partner_cents + total_markup_cents', p_order_id;
  end if;

  if v_order.total_customer_cents <> (v_order.subtotal_customer_cents + v_order.service_fee_cents + v_order.delivery_fee_cents) then
    raise exception 'Order % total_customer_cents must equal subtotal_customer_cents + service_fee_cents + delivery_fee_cents', p_order_id;
  end if;
end;
$$;

create or replace function public.validate_order_totals_trigger()
returns trigger
language plpgsql
as $$
declare
  v_order_id uuid;
begin
  if tg_table_name = 'orders' then
    v_order_id := coalesce(new.id, old.id);
  else
    v_order_id := coalesce(new.order_id, old.order_id);
  end if;

  perform public.validate_order_totals_for_order_id(v_order_id);
  return null;
end;
$$;

create or replace function public.validate_partner_review_order()
returns trigger
language plpgsql
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order
  from public.orders o
  where o.id = new.order_id;

  if v_order.id is null then
    raise exception 'Order not found';
  end if;

  if v_order.order_status <> 'delivered' then
    raise exception 'Partner review requires a delivered order';
  end if;

  if v_order.client_user_id <> new.client_user_id then
    raise exception 'Partner review client does not match order client';
  end if;

  if v_order.partner_id <> new.partner_id then
    raise exception 'Partner review partner does not match order partner';
  end if;

  return new;
end;
$$;

create or replace function public.validate_courier_review_order()
returns trigger
language plpgsql
as $$
declare
  v_order public.orders%rowtype;
  v_delivery public.deliveries%rowtype;
begin
  select * into v_order
  from public.orders o
  where o.id = new.order_id;

  select * into v_delivery
  from public.deliveries d
  where d.order_id = new.order_id;

  if v_order.id is null then
    raise exception 'Order not found';
  end if;

  if v_delivery.id is null then
    raise exception 'Delivery not found';
  end if;

  if v_order.order_status <> 'delivered' then
    raise exception 'Courier review requires a delivered order';
  end if;

  if v_order.client_user_id <> new.client_user_id then
    raise exception 'Courier review client does not match order client';
  end if;

  if v_delivery.courier_id is null or v_delivery.courier_id <> new.courier_id then
    raise exception 'Courier review courier does not match delivery courier';
  end if;

  return new;
end;
$$;

create or replace function public.validate_satisfaction_response_order()
returns trigger
language plpgsql
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order
  from public.orders o
  where o.id = new.order_id;

  if v_order.id is null then
    raise exception 'Order not found';
  end if;

  if v_order.order_status <> 'delivered' then
    raise exception 'Satisfaction response requires a delivered order';
  end if;

  if v_order.client_user_id <> new.client_user_id then
    raise exception 'Satisfaction response client does not match order client';
  end if;

  return new;
end;
$$;

create or replace function public.validate_loyalty_transaction_source()
returns trigger
language plpgsql
as $$
declare
  v_count integer := 0;
begin
  v_count :=
    (case when new.order_id is not null then 1 else 0 end)
    + (case when new.partner_review_id is not null then 1 else 0 end)
    + (case when new.courier_review_id is not null then 1 else 0 end)
    + (case when new.satisfaction_response_id is not null then 1 else 0 end);

  if v_count <> 1 then
    raise exception 'Exactly one loyalty source reference must be set';
  end if;

  case new.source
    when 'order' then
      if new.order_id is null then
        raise exception 'Order loyalty transaction requires order_id';
      end if;
    when 'partner_review' then
      if new.partner_review_id is null then
        raise exception 'Partner review loyalty transaction requires partner_review_id';
      end if;
    when 'courier_review' then
      if new.courier_review_id is null then
        raise exception 'Courier review loyalty transaction requires courier_review_id';
      end if;
    when 'satisfaction_response' then
      if new.satisfaction_response_id is null then
        raise exception 'Satisfaction response loyalty transaction requires satisfaction_response_id';
      end if;
  end case;

  return new;
end;
$$;

create or replace function public.validate_notification_pack_purchase_values()
returns trigger
language plpgsql
as $$
begin
  case new.pack_type
    when 'discovery' then
      if new.campaigns_included <> 15 or new.amount_cents <> 999 then
        raise exception 'Pack discovery must map to Découverte: 15 campaigns / 9.99€';
      end if;
    when 'boost' then
      if new.campaigns_included <> 50 or new.amount_cents <> 2499 then
        raise exception 'Pack boost must map to Boost: 50 campaigns / 24.99€';
      end if;
    when 'performance' then
      if new.campaigns_included <> 150 or new.amount_cents <> 5999 then
        raise exception 'Pack performance must map to Performance: 150 campaigns / 59.99€';
      end if;
  end case;

  return new;
end;
$$;

create or replace function public.validate_notification_credit_ledger_links()
returns trigger
language plpgsql
as $$
begin
  case new.source_type
    when 'pack_purchase' then
      if new.pack_purchase_id is null or new.campaign_id is not null then
        raise exception 'pack_purchase ledger entries require pack_purchase_id and no campaign_id';
      end if;
    when 'campaign_consumption' then
      if new.campaign_id is null or new.pack_purchase_id is not null then
        raise exception 'campaign_consumption ledger entries require campaign_id and no pack_purchase_id';
      end if;
  end case;

  return new;
end;
$$;

create or replace function public.validate_order_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.order_status = old.order_status then
    return new;
  end if;

  if (
    (old.order_status = 'pending_payment' and new.order_status in ('paid', 'cancelled'))
    or (old.order_status = 'paid' and new.order_status in ('in_preparation', 'cancelled'))
    or (old.order_status = 'in_preparation' and new.order_status in ('ready_for_pickup', 'cancelled'))
    or (old.order_status = 'ready_for_pickup' and new.order_status in ('courier_assigned', 'cancelled'))
    or (old.order_status = 'courier_assigned' and new.order_status in ('picked_up', 'cancelled'))
    or (old.order_status = 'picked_up' and new.order_status = 'delivered')
  ) then
    return new;
  end if;

  raise exception 'Invalid order status transition: % -> %', old.order_status, new.order_status;
end;
$$;

create or replace function public.validate_delivery_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if (
    (old.status = 'pending_assignment' and new.status in ('courier_assigned', 'cancelled'))
    or (old.status = 'courier_assigned' and new.status in ('picked_up', 'cancelled'))
    or (old.status = 'picked_up' and new.status = 'delivered')
  ) then
    return new;
  end if;

  raise exception 'Invalid delivery status transition: % -> %', old.status, new.status;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger client_addresses_set_updated_at
before update on public.client_addresses
for each row execute function public.set_updated_at();

create trigger partners_set_updated_at
before update on public.partners
for each row execute function public.set_updated_at();

create trigger partner_documents_set_updated_at
before update on public.partner_documents
for each row execute function public.set_updated_at();

create trigger couriers_set_updated_at
before update on public.couriers
for each row execute function public.set_updated_at();

create trigger courier_availabilities_set_updated_at
before update on public.courier_availabilities
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create trigger delivery_zones_set_updated_at
before update on public.delivery_zones
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger order_payments_set_updated_at
before update on public.order_payments
for each row execute function public.set_updated_at();

create trigger deliveries_set_updated_at
before update on public.deliveries
for each row execute function public.set_updated_at();

create trigger loyalty_accounts_set_updated_at
before update on public.loyalty_accounts
for each row execute function public.set_updated_at();

create trigger referrals_set_updated_at
before update on public.referrals
for each row execute function public.set_updated_at();

create trigger notification_devices_set_updated_at
before update on public.notification_devices
for each row execute function public.set_updated_at();

create trigger partner_notification_pack_purchases_set_updated_at
before update on public.partner_notification_pack_purchases
for each row execute function public.set_updated_at();

create trigger partner_notification_campaigns_set_updated_at
before update on public.partner_notification_campaigns
for each row execute function public.set_updated_at();

create trigger notification_dispatches_set_updated_at
before update on public.notification_dispatches
for each row execute function public.set_updated_at();

create trigger partner_payouts_set_updated_at
before update on public.partner_payouts
for each row execute function public.set_updated_at();

create trigger courier_payouts_set_updated_at
before update on public.courier_payouts
for each row execute function public.set_updated_at();

create trigger account_suspensions_set_updated_at
before update on public.account_suspensions
for each row execute function public.set_updated_at();

create trigger client_addresses_require_client_role
before insert or update on public.client_addresses
for each row execute function public.guard_profile_role_fk('client_user_id', 'client');

create trigger partners_require_partner_role
before insert or update on public.partners
for each row execute function public.guard_profile_role_fk('user_id', 'partner');

create trigger partners_require_admin_reviewer_role
before insert or update on public.partners
for each row execute function public.guard_profile_role_fk('reviewed_by_admin_user_id', 'admin');

create trigger partner_documents_require_admin_reviewer_role
before insert or update on public.partner_documents
for each row execute function public.guard_profile_role_fk('reviewed_by_admin_user_id', 'admin');

create trigger couriers_require_courier_role
before insert or update on public.couriers
for each row execute function public.guard_profile_role_fk('user_id', 'courier');

create trigger couriers_require_admin_reviewer_role
before insert or update on public.couriers
for each row execute function public.guard_profile_role_fk('reviewed_by_admin_user_id', 'admin');

create trigger loyalty_accounts_require_client_role
before insert or update on public.loyalty_accounts
for each row execute function public.guard_profile_role_fk('client_user_id', 'client');

create trigger partner_payouts_require_admin_processor_role
before insert or update on public.partner_payouts
for each row execute function public.guard_profile_role_fk('processed_by_admin_user_id', 'admin');

create trigger courier_payouts_require_admin_processor_role
before insert or update on public.courier_payouts
for each row execute function public.guard_profile_role_fk('processed_by_admin_user_id', 'admin');

create trigger account_suspensions_require_admin_actor_role
before insert or update on public.account_suspensions
for each row execute function public.guard_profile_role_fk('imposed_by_admin_user_id', 'admin');

create trigger admin_action_logs_require_admin_role
before insert or update on public.admin_action_logs
for each row execute function public.guard_profile_role_fk('admin_user_id', 'admin');

create trigger profiles_guard_protected_columns
before update on public.profiles
for each row execute function public.guard_profiles_protected_columns();

create trigger partners_guard_protected_columns
before update on public.partners
for each row execute function public.guard_partners_protected_columns();

create trigger couriers_guard_protected_columns
before update on public.couriers
for each row execute function public.guard_couriers_protected_columns();

create trigger partner_documents_guard_update
before update on public.partner_documents
for each row execute function public.guard_partner_documents_update();

create trigger products_validate_category_partner_type
before insert or update on public.products
for each row execute function public.validate_product_category_partner_type();

create trigger carts_validate_delivery_address_ownership
before insert or update on public.carts
for each row execute function public.validate_cart_delivery_address_ownership();

create trigger cart_items_validate_partner_consistency
before insert or update on public.cart_items
for each row execute function public.validate_cart_item_partner_consistency();

create trigger orders_validate_cart_and_address_consistency
before insert or update on public.orders
for each row execute function public.validate_order_cart_and_address_consistency();

create trigger order_items_validate_partner_consistency
before insert or update on public.order_items
for each row execute function public.validate_order_item_partner_consistency();

create trigger order_items_validate_foodiz_pricing
before insert or update on public.order_items
for each row execute function public.validate_order_item_foodiz_pricing();

create trigger partner_reviews_validate_order
before insert or update on public.partner_reviews
for each row execute function public.validate_partner_review_order();

create trigger courier_reviews_validate_order
before insert or update on public.courier_reviews
for each row execute function public.validate_courier_review_order();

create trigger satisfaction_responses_validate_order
before insert or update on public.satisfaction_responses
for each row execute function public.validate_satisfaction_response_order();

create trigger loyalty_transactions_validate_source
before insert or update on public.loyalty_transactions
for each row execute function public.validate_loyalty_transaction_source();

create trigger partner_notification_pack_purchases_validate_values
before insert or update on public.partner_notification_pack_purchases
for each row execute function public.validate_notification_pack_purchase_values();

create trigger partner_notification_credit_ledger_validate_links
before insert or update on public.partner_notification_credit_ledger
for each row execute function public.validate_notification_credit_ledger_links();

create trigger orders_validate_status_transition
before update on public.orders
for each row
when (old.order_status is distinct from new.order_status)
execute function public.validate_order_status_transition();

create trigger deliveries_validate_status_transition
before update on public.deliveries
for each row
when (old.status is distinct from new.status)
execute function public.validate_delivery_status_transition();

create constraint trigger order_items_validate_order_totals_after_change
after insert or update or delete on public.order_items
deferrable initially deferred
for each row execute function public.validate_order_totals_trigger();

create constraint trigger orders_validate_order_totals_after_change
after insert or update on public.orders
deferrable initially deferred
for each row execute function public.validate_order_totals_trigger();
