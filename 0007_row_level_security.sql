alter table public.profiles enable row level security;
alter table public.client_addresses enable row level security;
alter table public.partners enable row level security;
alter table public.partner_documents enable row level security;
alter table public.couriers enable row level security;
alter table public.courier_availabilities enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_payments enable row level security;
alter table public.deliveries enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.partner_reviews enable row level security;
alter table public.courier_reviews enable row level security;
alter table public.satisfaction_responses enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.referrals enable row level security;
alter table public.notification_devices enable row level security;
alter table public.partner_notification_pack_purchases enable row level security;
alter table public.partner_notification_campaigns enable row level security;
alter table public.partner_notification_credit_ledger enable row level security;
alter table public.notification_dispatches enable row level security;
alter table public.partner_payouts enable row level security;
alter table public.courier_payouts enable row level security;
alter table public.account_suspensions enable row level security;
alter table public.admin_action_logs enable row level security;
alter table public.domain_events enable row level security;

create policy profiles_select_own_or_admin
on public.profiles
for select
using (
  auth.uid() = user_id
  or public.is_admin()
);

create policy profiles_update_own_or_admin
on public.profiles
for update
using (
  auth.uid() = user_id
  or public.is_admin()
)
with check (
  auth.uid() = user_id
  or public.is_admin()
);

create policy client_addresses_select_owner_or_admin
on public.client_addresses
for select
using (
  auth.uid() = client_user_id
  or public.is_admin()
);

create policy client_addresses_insert_owner
on public.client_addresses
for insert
with check (
  auth.uid() = client_user_id
  and public.is_client()
);

create policy client_addresses_update_owner_or_admin
on public.client_addresses
for update
using (
  auth.uid() = client_user_id
  or public.is_admin()
)
with check (
  auth.uid() = client_user_id
  or public.is_admin()
);

create policy client_addresses_delete_owner_or_admin
on public.client_addresses
for delete
using (
  auth.uid() = client_user_id
  or public.is_admin()
);

create policy partners_select_owner_or_admin
on public.partners
for select
using (
  public.is_admin()
  or auth.uid() = user_id
);

create policy partners_insert_owner
on public.partners
for insert
with check (
  auth.uid() = user_id
  and public.is_partner()
);

create policy partners_update_owner_or_admin
on public.partners
for update
using (
  public.is_admin()
  or auth.uid() = user_id
)
with check (
  public.is_admin()
  or auth.uid() = user_id
);

create policy partner_documents_select_owner_or_admin
on public.partner_documents
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy partner_documents_insert_owner
on public.partner_documents
for insert
with check (
  exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy partner_documents_update_owner_or_admin
on public.partner_documents
for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy partner_documents_delete_admin
on public.partner_documents
for delete
using (public.is_admin());

create policy couriers_select_owner_or_admin
on public.couriers
for select
using (
  public.is_admin()
  or auth.uid() = user_id
);

create policy couriers_insert_owner
on public.couriers
for insert
with check (
  auth.uid() = user_id
  and public.is_courier()
);

create policy couriers_update_owner_or_admin
on public.couriers
for update
using (
  public.is_admin()
  or auth.uid() = user_id
)
with check (
  public.is_admin()
  or auth.uid() = user_id
);

create policy courier_availabilities_select_owner_or_admin
on public.courier_availabilities
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.couriers c
    where c.id = courier_id
      and c.user_id = auth.uid()
  )
);

create policy courier_availabilities_insert_owner
on public.courier_availabilities
for insert
with check (
  exists (
    select 1
    from public.couriers c
    where c.id = courier_id
      and c.user_id = auth.uid()
  )
);

create policy courier_availabilities_update_owner_or_admin
on public.courier_availabilities
for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.couriers c
    where c.id = courier_id
      and c.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.couriers c
    where c.id = courier_id
      and c.user_id = auth.uid()
  )
);

create policy courier_availabilities_delete_owner_or_admin
on public.courier_availabilities
for delete
using (
  public.is_admin()
  or exists (
    select 1
    from public.couriers c
    where c.id = courier_id
      and c.user_id = auth.uid()
  )
);

create policy categories_select_authenticated
on public.categories
for select
using (auth.role() = 'authenticated');

create policy categories_admin_insert
on public.categories
for insert
with check (public.is_admin());

create policy categories_admin_update
on public.categories
for update
using (public.is_admin())
with check (public.is_admin());

create policy categories_admin_delete
on public.categories
for delete
using (public.is_admin());

create policy products_select_owner_or_admin
on public.products
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy products_insert_owner_or_admin
on public.products
for insert
with check (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy products_update_owner_or_admin
on public.products
for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy products_delete_owner_or_admin
on public.products
for delete
using (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy carts_select_owner_or_admin
on public.carts
for select
using (
  auth.uid() = client_user_id
  or public.is_admin()
);

create policy carts_insert_owner
on public.carts
for insert
with check (
  auth.uid() = client_user_id
  and public.is_client()
);

create policy carts_update_owner_or_admin
on public.carts
for update
using (
  auth.uid() = client_user_id
  or public.is_admin()
)
with check (
  auth.uid() = client_user_id
  or public.is_admin()
);

create policy carts_delete_owner_or_admin
on public.carts
for delete
using (
  auth.uid() = client_user_id
  or public.is_admin()
);

create policy cart_items_select_admin_only
on public.cart_items
for select
using (public.is_admin());

create policy cart_items_insert_owner
on public.cart_items
for insert
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_id
      and c.client_user_id = auth.uid()
  )
  and public.is_client()
);

create policy cart_items_update_owner_or_admin
on public.cart_items
for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.carts c
    where c.id = cart_id
      and c.client_user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.carts c
    where c.id = cart_id
      and c.client_user_id = auth.uid()
  )
);

create policy cart_items_delete_owner_or_admin
on public.cart_items
for delete
using (
  public.is_admin()
  or exists (
    select 1
    from public.carts c
    where c.id = cart_id
      and c.client_user_id = auth.uid()
  )
);

create policy delivery_zones_select_admin
on public.delivery_zones
for select
using (public.is_admin());

create policy delivery_zones_insert_admin
on public.delivery_zones
for insert
with check (public.is_admin());

create policy delivery_zones_update_admin
on public.delivery_zones
for update
using (public.is_admin())
with check (public.is_admin());

create policy delivery_zones_delete_admin
on public.delivery_zones
for delete
using (public.is_admin());

create policy orders_select_partner_courier_admin
on public.orders
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.deliveries d
    join public.couriers c on c.id = d.courier_id
    where d.order_id = orders.id
      and c.user_id = auth.uid()
  )
);

create policy order_items_select_partner_courier_admin
on public.order_items
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        exists (
          select 1
          from public.partners p
          where p.id = o.partner_id
            and p.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.deliveries d
          join public.couriers c on c.id = d.courier_id
          where d.order_id = o.id
            and c.user_id = auth.uid()
        )
      )
  )
);

create policy order_payments_select_partner_or_admin
on public.order_payments
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    join public.partners p
      on p.id = o.partner_id
    where o.id = order_id
      and p.user_id = auth.uid()
  )
);

create policy deliveries_select_partner_courier_admin
on public.deliveries
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    join public.partners p
      on p.id = o.partner_id
    where o.id = order_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.couriers c
    where c.id = courier_id
      and c.user_id = auth.uid()
  )
);

create policy loyalty_accounts_select_owner_or_admin
on public.loyalty_accounts
for select
using (
  public.is_admin()
  or client_user_id = auth.uid()
);

create policy partner_reviews_select_author_partner_or_admin
on public.partner_reviews
for select
using (
  public.is_admin()
  or client_user_id = auth.uid()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy partner_reviews_insert_client_owner
on public.partner_reviews
for insert
with check (
  public.is_client()
  and client_user_id = auth.uid()
  and exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.client_user_id = auth.uid()
  )
);

create policy partner_reviews_admin_update
on public.partner_reviews
for update
using (public.is_admin())
with check (public.is_admin());

create policy partner_reviews_admin_delete
on public.partner_reviews
for delete
using (public.is_admin());

create policy courier_reviews_select_author_courier_or_admin
on public.courier_reviews
for select
using (
  public.is_admin()
  or client_user_id = auth.uid()
  or exists (
    select 1
    from public.couriers c
    where c.id = courier_id
      and c.user_id = auth.uid()
  )
);

create policy courier_reviews_insert_client_owner
on public.courier_reviews
for insert
with check (
  public.is_client()
  and client_user_id = auth.uid()
  and exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.client_user_id = auth.uid()
  )
);

create policy courier_reviews_admin_update
on public.courier_reviews
for update
using (public.is_admin())
with check (public.is_admin());

create policy courier_reviews_admin_delete
on public.courier_reviews
for delete
using (public.is_admin());

create policy satisfaction_responses_select_owner_or_admin
on public.satisfaction_responses
for select
using (
  public.is_admin()
  or client_user_id = auth.uid()
);

create policy satisfaction_responses_insert_client_owner
on public.satisfaction_responses
for insert
with check (
  public.is_client()
  and client_user_id = auth.uid()
  and exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.client_user_id = auth.uid()
  )
);

create policy satisfaction_responses_admin_update
on public.satisfaction_responses
for update
using (public.is_admin())
with check (public.is_admin());

create policy satisfaction_responses_admin_delete
on public.satisfaction_responses
for delete
using (public.is_admin());

create policy loyalty_transactions_select_owner_or_admin
on public.loyalty_transactions
for select
using (
  public.is_admin()
  or client_user_id = auth.uid()
);

create policy referrals_select_participants_or_admin
on public.referrals
for select
using (
  public.is_admin()
  or referrer_user_id = auth.uid()
  or referred_user_id = auth.uid()
);

create policy notification_devices_select_owner_or_admin
on public.notification_devices
for select
using (
  public.is_admin()
  or user_id = auth.uid()
);

create policy notification_devices_insert_owner
on public.notification_devices
for insert
with check (user_id = auth.uid());

create policy notification_devices_update_owner_or_admin
on public.notification_devices
for update
using (
  public.is_admin()
  or user_id = auth.uid()
)
with check (
  public.is_admin()
  or user_id = auth.uid()
);

create policy notification_devices_delete_owner_or_admin
on public.notification_devices
for delete
using (
  public.is_admin()
  or user_id = auth.uid()
);

create policy partner_notification_pack_purchases_select_owner_or_admin
on public.partner_notification_pack_purchases
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy partner_notification_campaigns_select_owner_or_admin
on public.partner_notification_campaigns
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy partner_notification_credit_ledger_select_owner_or_admin
on public.partner_notification_credit_ledger
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy notification_dispatches_select_admin
on public.notification_dispatches
for select
using (public.is_admin());

create policy partner_payouts_select_owner_or_admin
on public.partner_payouts
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.partners p
    where p.id = partner_id
      and p.user_id = auth.uid()
  )
);

create policy courier_payouts_select_owner_or_admin
on public.courier_payouts
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.couriers c
    where c.id = courier_id
      and c.user_id = auth.uid()
  )
);

create policy account_suspensions_select_owner_or_admin
on public.account_suspensions
for select
using (
  public.is_admin()
  or user_id = auth.uid()
);

create policy admin_action_logs_select_admin
on public.admin_action_logs
for select
using (public.is_admin());

create policy domain_events_select_admin
on public.domain_events
for select
using (public.is_admin());

revoke all on public.partner_public_view from public, anon;
revoke all on public.product_public_view from public, anon;
revoke all on public.client_cart_items_view from public, anon;
revoke all on public.client_order_summary_view from public, anon;
revoke all on public.client_order_items_view from public, anon;
revoke all on public.courier_available_deliveries_view from public, anon;
revoke all on public.courier_assigned_delivery_view from public, anon;
revoke all on public.partner_revenue_raw_view from public, anon;
revoke all on public.partner_payout_eligible_view from public, anon;
revoke all on public.courier_revenue_raw_view from public, anon;
revoke all on public.courier_payout_eligible_view from public, anon;
revoke all on public.partner_stats_view from public, anon;
revoke all on public.courier_stats_view from public, anon;
revoke all on public.admin_global_stats_view from public, anon;
revoke all on public.order_read_model_view from public, anon;

grant select on public.partner_public_view to authenticated;
grant select on public.product_public_view to authenticated;
grant select on public.client_cart_items_view to authenticated;
grant select on public.client_order_summary_view to authenticated;
grant select on public.client_order_items_view to authenticated;
grant select on public.courier_available_deliveries_view to authenticated;
grant select on public.courier_assigned_delivery_view to authenticated;
grant select on public.partner_revenue_raw_view to authenticated;
grant select on public.partner_payout_eligible_view to authenticated;
grant select on public.courier_revenue_raw_view to authenticated;
grant select on public.courier_payout_eligible_view to authenticated;
grant select on public.partner_stats_view to authenticated;
grant select on public.courier_stats_view to authenticated;
grant select on public.admin_global_stats_view to authenticated;
grant select on public.order_read_model_view to authenticated;
