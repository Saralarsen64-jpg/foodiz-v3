create unique index categories_unique_name_per_establishment_type_idx
  on public.categories (lower(name), establishment_type);

create index profiles_role_idx
  on public.profiles (role);

create index profiles_account_status_idx
  on public.profiles (account_status);

create index profiles_referred_by_user_id_idx
  on public.profiles (referred_by_user_id);

create index partners_validation_status_idx
  on public.partners (validation_status);

create index partners_establishment_type_idx
  on public.partners (establishment_type);

create index partners_siret_idx
  on public.partners (siret);

create index partners_city_postal_code_idx
  on public.partners (city, postal_code);

create index partner_documents_verification_status_idx
  on public.partner_documents (verification_status);

create index partner_documents_submitted_at_desc_idx
  on public.partner_documents (submitted_at desc);

create index couriers_validation_status_idx
  on public.couriers (validation_status);

create index courier_availabilities_courier_time_idx
  on public.courier_availabilities (courier_id, starts_at, ends_at);

create index categories_active_sort_idx
  on public.categories (establishment_type, is_active, sort_order);

create index products_partner_status_available_idx
  on public.products (partner_id, status, is_available);

create index products_partner_sort_order_idx
  on public.products (partner_id, sort_order);

create index products_partner_is_bestseller_idx
  on public.products (partner_id, is_bestseller);

create index products_partner_is_halal_idx
  on public.products (partner_id, is_halal);

create index products_category_id_idx
  on public.products (category_id);

create index products_name_trgm_idx
  on public.products using gin (name gin_trgm_ops);

create unique index carts_active_client_partner_unique_idx
  on public.carts (client_user_id, partner_id)
  where status = 'active';

create index cart_items_cart_id_idx
  on public.cart_items (cart_id);

create unique index cart_items_cart_product_unique_idx
  on public.cart_items (cart_id, product_id);

create index delivery_zones_city_is_active_idx
  on public.delivery_zones (city, is_active);

create index delivery_zones_city_is_default_idx
  on public.delivery_zones (city, is_default);

create index orders_client_created_at_desc_idx
  on public.orders (client_user_id, created_at desc);

create index orders_partner_status_created_at_desc_idx
  on public.orders (partner_id, order_status, created_at desc);

create index orders_delivery_zone_id_idx
  on public.orders (delivery_zone_id);

create index orders_status_created_at_desc_idx
  on public.orders (order_status, created_at desc);

create index order_items_order_id_idx
  on public.order_items (order_id);

create index order_payments_status_idx
  on public.order_payments (status);

create index deliveries_courier_status_idx
  on public.deliveries (courier_id, status);

create index deliveries_status_updated_at_desc_idx
  on public.deliveries (status, updated_at desc);

create index loyalty_transactions_client_created_at_desc_idx
  on public.loyalty_transactions (client_user_id, created_at desc);

create index referrals_referrer_user_id_idx
  on public.referrals (referrer_user_id);

create index referrals_status_idx
  on public.referrals (status);

create index partner_reviews_partner_created_at_desc_idx
  on public.partner_reviews (partner_id, created_at desc);

create index courier_reviews_courier_created_at_desc_idx
  on public.courier_reviews (courier_id, created_at desc);

create index notification_devices_user_is_active_idx
  on public.notification_devices (user_id, is_active);

create index partner_notification_pack_purchases_partner_created_at_desc_idx
  on public.partner_notification_pack_purchases (partner_id, created_at desc);

create index partner_notification_campaigns_partner_status_created_at_desc_idx
  on public.partner_notification_campaigns (partner_id, status, created_at desc);

create index partner_notification_campaigns_partner_sent_at_desc_idx
  on public.partner_notification_campaigns (partner_id, sent_at desc);

create index partner_notification_credit_ledger_partner_created_at_desc_idx
  on public.partner_notification_credit_ledger (partner_id, created_at desc);

create index notification_dispatches_recipient_created_at_desc_idx
  on public.notification_dispatches (recipient_user_id, created_at desc);

create index notification_dispatches_status_created_at_desc_idx
  on public.notification_dispatches (status, created_at desc);

create index partner_payouts_partner_status_created_at_desc_idx
  on public.partner_payouts (partner_id, status, created_at desc);

create index courier_payouts_courier_status_created_at_desc_idx
  on public.courier_payouts (courier_id, status, created_at desc);

create index account_suspensions_user_id_active_partial_idx
  on public.account_suspensions (user_id)
  where is_active = true;

create index admin_action_logs_admin_created_at_desc_idx
  on public.admin_action_logs (admin_user_id, created_at desc);

create index admin_action_logs_target_table_target_id_idx
  on public.admin_action_logs (target_table, target_id);

create index domain_events_aggregate_idx
  on public.domain_events (aggregate_type, aggregate_id, emitted_at desc);

create or replace view public.partner_public_view
with (security_barrier = true) as
select
  p.id as partner_id,
  p.establishment_type,
  p.display_name,
  p.description,
  p.logo_url,
  p.cover_image_url,
  p.opening_hours,
  p.minimum_order_cents,
  p.is_halal,
  p.address_line_1,
  p.address_line_2,
  p.postal_code,
  p.city,
  p.country_code,
  p.latitude,
  p.longitude,
  p.created_at,
  p.updated_at
from public.partners p
where p.validation_status = 'approved';

comment on view public.partner_public_view is 'Public partner exposure for authenticated clients. Never exposes private partner compliance fields such as siret or rc_pro tracking.';

create or replace view public.product_public_view
with (security_barrier = true) as
select
  pr.id as product_id,
  pr.partner_id,
  pr.category_id,
  pr.name,
  pr.description,
  pr.image_url,
  pr.is_halal,
  pr.is_bestseller,
  pr.sort_order,
  pr.status,
  pr.is_available,
  (pr.partner_price_cents + public.foodiz_markup_from_partner_price_cents(pr.partner_price_cents)) as customer_price_cents
from public.products pr
join public.partners p
  on p.id = pr.partner_id
where p.validation_status = 'approved'
  and pr.status = 'active'
  and pr.is_available = true;

comment on view public.product_public_view is 'Public client-safe product exposure. Exposes customer_price_cents only and never the partner_price_cents.';

create or replace view public.courier_available_deliveries_view
with (security_barrier = true) as
select
  d.id as delivery_id,
  o.id as order_id,
  o.partner_id,
  p.display_name as partner_display_name,
  p.establishment_type,
  o.item_count,
  o.distance_km,
  o.delivery_zone_id,
  p.city as pickup_city,
  p.postal_code as pickup_postal_code,
  o.delivery_city,
  o.delivery_postal_code,
  d.status as delivery_status,
  o.order_status,
  o.placed_at
from public.deliveries d
join public.orders o
  on o.id = d.order_id
join public.partners p
  on p.id = o.partner_id
where d.status = 'pending_assignment'
  and exists (
    select 1
    from public.couriers c
    join public.profiles pr
      on pr.user_id = c.user_id
    where c.user_id = auth.uid()
      and c.validation_status = 'approved'
      and pr.role = 'courier'
      and pr.account_status = 'active'
  );

comment on view public.courier_available_deliveries_view is 'Available deliveries for approved couriers. Does not expose the exact client delivery address before assignment.';

create or replace view public.courier_assigned_delivery_view
with (security_barrier = true) as
select
  d.id as delivery_id,
  d.order_id,
  d.courier_id,
  o.partner_id,
  p.display_name as partner_display_name,
  p.establishment_type,
  p.address_line_1 as pickup_address_line_1,
  p.address_line_2 as pickup_address_line_2,
  p.postal_code as pickup_postal_code,
  p.city as pickup_city,
  p.country_code as pickup_country_code,
  p.latitude as pickup_latitude,
  p.longitude as pickup_longitude,
  o.delivery_address_line_1,
  o.delivery_address_line_2,
  o.delivery_postal_code,
  o.delivery_city,
  o.delivery_country_code,
  o.delivery_latitude,
  o.delivery_longitude,
  d.delivery_notes,
  d.proof_image_url,
  d.status as delivery_status,
  o.order_status,
  o.item_count,
  o.distance_km,
  d.accepted_at,
  d.pickup_confirmed_at,
  d.delivered_at,
  d.client_confirmed_at,
  o.placed_at
from public.deliveries d
join public.orders o
  on o.id = d.order_id
join public.partners p
  on p.id = o.partner_id
where exists (
  select 1
  from public.couriers c
  join public.profiles pr
    on pr.user_id = c.user_id
  where c.id = d.courier_id
    and c.user_id = auth.uid()
    and c.validation_status = 'approved'
    and pr.role = 'courier'
    and pr.account_status = 'active'
);

comment on view public.courier_assigned_delivery_view is 'Detailed delivery view for the assigned courier only. Exposes the delivery snapshot address required to complete the mission.';

create or replace view public.client_cart_items_view
with (security_barrier = true) as
select
  ci.id as cart_item_id,
  ci.cart_id,
  ci.product_id,
  pr.name as product_name,
  pr.image_url as product_image_url,
  ci.quantity,
  (pr.partner_price_cents + public.foodiz_markup_from_partner_price_cents(pr.partner_price_cents)) as customer_unit_price_cents,
  (ci.quantity * (pr.partner_price_cents + public.foodiz_markup_from_partner_price_cents(pr.partner_price_cents))) as line_customer_subtotal_cents,
  pr.is_available
from public.cart_items ci
join public.carts c
  on c.id = ci.cart_id
join public.products pr
  on pr.id = ci.product_id
where c.client_user_id = auth.uid();

comment on view public.client_cart_items_view is 'Client-safe cart item exposure. Shows only customer-facing cart prices and never the partner unit price.';

create or replace view public.client_order_summary_view
with (security_barrier = true) as
select
  o.id as order_id,
  o.partner_id,
  p.display_name as partner_display_name,
  p.establishment_type,
  o.order_status,
  d.status as delivery_status,
  o.item_count,
  o.subtotal_customer_cents,
  o.service_fee_cents,
  o.delivery_fee_cents,
  o.total_customer_cents,
  op.status as payment_status,
  o.placed_at,
  o.paid_at,
  o.delivered_at,
  o.cancelled_at
from public.orders o
join public.partners p
  on p.id = o.partner_id
left join public.deliveries d
  on d.order_id = o.id
left join public.order_payments op
  on op.order_id = o.id
where o.client_user_id = auth.uid();

comment on view public.client_order_summary_view is 'Client-safe order summary exposure. Shows only customer-facing totals and statuses, never internal Foodiz margins or partner payout bases.';

create or replace view public.client_order_items_view
with (security_barrier = true) as
select
  oi.id as order_item_id,
  oi.order_id,
  oi.product_id,
  oi.product_name_snapshot,
  oi.quantity,
  oi.unit_customer_price_cents as customer_unit_price_cents,
  oi.line_customer_subtotal_cents,
  oi.created_at
from public.order_items oi
join public.orders o
  on o.id = oi.order_id
where o.client_user_id = auth.uid();

comment on view public.client_order_items_view is 'Client-safe order item exposure. Shows customer unit price and line subtotal only.';

create or replace view public.partner_revenue_raw_view
with (security_invoker = true) as
select
  o.id as order_id,
  o.partner_id,
  o.client_user_id,
  o.order_status,
  o.subtotal_partner_cents as partner_payout_base_cents,
  o.total_markup_cents,
  o.service_fee_cents,
  o.total_customer_cents,
  o.placed_at,
  o.paid_at,
  o.delivered_at,
  o.cancelled_at
from public.orders o;

comment on view public.partner_revenue_raw_view is 'Raw partner revenue view. Partner payout base is orders.subtotal_partner_cents.';

create or replace view public.partner_payout_eligible_view
with (security_invoker = true) as
select
  o.id as order_id,
  o.partner_id,
  o.client_user_id,
  o.order_status,
  o.subtotal_partner_cents as partner_payout_base_cents,
  o.total_markup_cents,
  o.service_fee_cents,
  o.total_customer_cents,
  o.placed_at,
  o.paid_at,
  o.delivered_at
from public.orders o
where o.order_status <> 'cancelled'
  and o.cancelled_at is null;

comment on view public.partner_payout_eligible_view is 'Partner payout eligible orders only. Cancelled orders are excluded. Payout base remains orders.subtotal_partner_cents.';

create or replace view public.courier_revenue_raw_view
with (security_invoker = true) as
select
  o.id as order_id,
  d.courier_id,
  o.partner_id,
  o.order_status,
  o.courier_share_cents as courier_article_share_cents,
  o.delivery_fee_cents,
  (o.courier_share_cents + o.delivery_fee_cents) as courier_total_earning_cents,
  o.placed_at,
  o.paid_at,
  o.delivered_at,
  o.cancelled_at
from public.orders o
join public.deliveries d
  on d.order_id = o.id
where d.courier_id is not null;

comment on view public.courier_revenue_raw_view is 'Raw courier revenue view. Final courier earning = orders.courier_share_cents + orders.delivery_fee_cents.';

create or replace view public.courier_payout_eligible_view
with (security_invoker = true) as
select
  o.id as order_id,
  d.courier_id,
  o.partner_id,
  o.order_status,
  o.courier_share_cents as courier_article_share_cents,
  o.delivery_fee_cents,
  (o.courier_share_cents + o.delivery_fee_cents) as courier_total_earning_cents,
  o.placed_at,
  o.paid_at,
  o.delivered_at
from public.orders o
join public.deliveries d
  on d.order_id = o.id
where d.courier_id is not null
  and o.order_status <> 'cancelled'
  and o.cancelled_at is null;

comment on view public.courier_payout_eligible_view is 'Courier payout eligible orders only. Cancelled orders are excluded. Final courier earning = orders.courier_share_cents + orders.delivery_fee_cents.';

create or replace view public.partner_stats_view
with (security_invoker = true) as
select
  o.partner_id,
  count(*) as total_orders_raw,
  count(*) filter (where o.order_status = 'delivered') as delivered_orders,
  count(*) filter (where o.order_status = 'cancelled') as cancelled_orders,
  coalesce(sum(o.subtotal_partner_cents), 0) as total_partner_subtotal_cents_raw,
  coalesce(sum(o.total_customer_cents), 0) as total_customer_cents_raw,
  coalesce(sum(o.subtotal_partner_cents) filter (where o.order_status <> 'cancelled' and o.cancelled_at is null), 0) as total_partner_subtotal_cents_payout_eligible,
  coalesce(sum(o.total_customer_cents) filter (where o.order_status <> 'cancelled' and o.cancelled_at is null), 0) as total_customer_cents_payout_eligible
from public.orders o
group by o.partner_id;

create or replace view public.courier_stats_view
with (security_invoker = true) as
select
  d.courier_id,
  count(*) as total_assigned_deliveries_raw,
  count(*) filter (where d.status = 'delivered') as delivered_deliveries,
  count(*) filter (where d.status = 'cancelled') as cancelled_deliveries,
  coalesce(sum(o.courier_share_cents + o.delivery_fee_cents), 0) as total_courier_earning_cents_raw,
  coalesce(sum(o.courier_share_cents + o.delivery_fee_cents) filter (where o.order_status <> 'cancelled' and o.cancelled_at is null), 0) as total_courier_earning_cents_payout_eligible
from public.deliveries d
join public.orders o
  on o.id = d.order_id
where d.courier_id is not null
group by d.courier_id;

create or replace view public.admin_global_stats_view
with (security_barrier = true) as
select
  (select count(*) from public.profiles) as total_users,
  (select count(*) from public.profiles where role = 'client') as total_clients,
  (select count(*) from public.profiles where role = 'partner') as total_partners,
  (select count(*) from public.profiles where role = 'courier') as total_couriers,
  (select count(*) from public.orders) as total_orders,
  (select count(*) from public.orders where order_status = 'paid') as paid_orders,
  (select count(*) from public.orders where order_status = 'delivered') as delivered_orders,
  (select count(*) from public.orders where order_status = 'cancelled') as cancelled_orders
from (select 1 as gate) s
where public.is_admin();

create or replace view public.order_read_model_view
with (security_invoker = true) as
select
  o.id as order_id,
  o.client_user_id,
  o.partner_id,
  p.display_name as partner_display_name,
  p.establishment_type,
  o.order_status,
  o.item_count,
  o.subtotal_partner_cents,
  o.subtotal_customer_cents,
  o.total_markup_cents,
  o.courier_share_cents,
  o.delivery_fee_cents,
  (o.courier_share_cents + o.delivery_fee_cents) as courier_total_earning_cents,
  o.service_fee_cents,
  o.total_customer_cents,
  op.status as payment_status,
  d.courier_id,
  d.status as delivery_status,
  d.proof_image_url,
  d.delivery_notes,
  o.placed_at,
  o.paid_at,
  o.delivered_at,
  o.cancelled_at
from public.orders o
join public.partners p
  on p.id = o.partner_id
left join public.order_payments op
  on op.order_id = o.id
left join public.deliveries d
  on d.order_id = o.id;
