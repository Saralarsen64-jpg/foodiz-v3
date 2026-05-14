# FOODIZ TECHNICAL BLUEPRINT

Version: 1.1  
Statut: Blueprint technique officiel avant implémentation  
Dépendance: Ce document applique strictement `FOODIZ_MASTER_SPEC.md`  
Règle absolue: aucune fonctionnalité produit n’est ajoutée dans ce blueprint. Les choix ci-dessous sont des choix d’architecture et de modélisation nécessaires pour implémenter fidèlement le MASTER SPEC.

---

## 0. Principes de gouvernance technique

### 0.1 Objectif du blueprint
Définir l’architecture technique détaillée officielle de Foodiz pour permettre une implémentation :
- propre
- maintenable
- scalable
- sécurisée
- performante
- production ready

### 0.2 Règles de cadrage
Ce blueprint :
- ne modifie aucune règle métier du MASTER SPEC
- ne crée aucune fonctionnalité utilisateur supplémentaire
- transforme les règles existantes en architecture technique exécutable

### 0.3 Invariants techniques dérivés du MASTER SPEC
Les invariants suivants sont nécessaires pour implémenter les parcours officiels sans ambiguïté :
- pour le MVP, un `partner` correspond à un seul établissement
- la structure doit toutefois rester évolutive pour supporter plusieurs établissements plus tard via une migration versionnée, sans remettre en cause le modèle d’authentification ni les rôles
- un `order` appartient à un seul `partner`
- un `delivery` appartient à un seul `order`
- les calculs économiques sont figés au moment de la commande dans des snapshots SQL
- tous les montants monétaires sont stockés en centimes d’euro (`*_cents`)
- tous les accès sensibles passent soit par RLS, soit par services backend privilégiés

Si un jour l’un de ces invariants doit changer, cela nécessitera une révision explicite du MASTER SPEC.

---

## 1. Enums officiels

Les enums ci-dessous constituent le vocabulaire technique officiel du projet.

### 1.1 Rôles et comptes
- `user_role_enum`
  - `client`
  - `partner`
  - `courier`
  - `admin`

- `account_status_enum`
  - `active`
  - `suspended`
  - `deleted`

### 1.2 Partner / établissements / validation
- `establishment_type_enum`
  - `restaurant`
  - `market`

Rappel conformité MASTER SPEC :
- `sweet_night` n’existe pas
- `market_day` n’existe pas
- `market_night` n’existe pas

- `partner_validation_status_enum`
  - `pending`
  - `approved`
  - `rejected`
  - `suspended`

- `courier_validation_status_enum`
  - `pending`
  - `approved`
  - `rejected`
  - `suspended`

- `partner_document_type_enum`
  - `siret`
  - `identity_document`
  - `kbis`
  - `rc_pro`

- `partner_document_status_enum`
  - `pending_review`
  - `approved`
  - `rejected`

### 1.3 Catalogue / panier / commande / paiement
- `product_status_enum`
  - `active`
  - `inactive`

- `cart_status_enum`
  - `active`
  - `converted`
  - `expired`

- `order_status_enum`
  - `pending_payment`
  - `paid`
  - `in_preparation`
  - `ready_for_pickup`
  - `courier_assigned`
  - `picked_up`
  - `delivered`
  - `cancelled`

- `payment_status_enum`
  - `pending`
  - `succeeded`
  - `failed`
  - `cancelled`

- `delivery_status_enum`
  - `pending_assignment`
  - `courier_assigned`
  - `picked_up`
  - `delivered`
  - `cancelled`

- `delivery_fee_model_enum`
  - `zone_fixed`
  - `zone_distance_variable`

### 1.4 Fidélité / parrainage / avis
- `loyalty_source_enum`
  - `order`
  - `partner_review`
  - `courier_review`
  - `satisfaction_response`

- `referral_status_enum`
  - `pending`
  - `rewarded`
  - `cancelled`

### 1.5 Notifications
- `device_platform_enum`
  - `ios`
  - `android`
  - `web`

- `notification_pack_type_enum`
  - `discovery`
  - `boost`
  - `performance`

Correspondance officielle Foodiz :
- `discovery` = Pack **Découverte**
- `boost` = Pack **Boost**
- `performance` = Pack **Performance**

- `notification_campaign_status_enum`
  - `draft`
  - `generated`
  - `sent`
  - `cancelled`

- `notification_credit_source_enum`
  - `pack_purchase`
  - `campaign_consumption`

- `notification_message_type_enum`
  - `transactional`
  - `partner_campaign`

- `notification_dispatch_status_enum`
  - `pending`
  - `sent`
  - `failed`

### 1.6 Finance / logs
- `payout_status_enum`
  - `pending`
  - `paid`
  - `cancelled`

---

## 2. Tables complètes

Convention globale :
- toutes les PK applicatives sont des `uuid`
- tous les timestamps sont en `timestamptz`
- toutes les tables métier ont `created_at`
- toutes les tables mutables ont `updated_at`
- tous les montants sont stockés en centimes

### 2.1 Auth et profils

#### `profiles`
Rôle : profil applicatif principal lié à `auth.users`.

Colonnes :
- `user_id uuid PK FK -> auth.users.id ON DELETE CASCADE`
- `role user_role_enum NOT NULL`
- `account_status account_status_enum NOT NULL DEFAULT 'active'`
- `email text NOT NULL UNIQUE`
- `first_name text NULL`
- `last_name text NULL`
- `phone text NULL`
- `referral_code text NULL UNIQUE`
- `referred_by_user_id uuid NULL FK -> profiles.user_id`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`

#### `client_addresses`
Rôle : adresses multiples du client.

Colonnes :
- `id uuid PK`
- `client_user_id uuid NOT NULL FK -> profiles.user_id ON DELETE CASCADE`
- `label text NOT NULL`
- `address_line_1 text NOT NULL`
- `address_line_2 text NULL`
- `postal_code text NOT NULL`
- `city text NOT NULL`
- `country_code text NOT NULL`
- `latitude numeric(9,6) NOT NULL`
- `longitude numeric(9,6) NOT NULL`
- `is_default boolean NOT NULL DEFAULT false`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### 2.2 Partner

#### `partners`
Rôle : compte professionnel et établissement unique pour le MVP.

Note d’évolutivité :
- en version MVP, `partners` regroupe le compte professionnel et l’unique établissement associé
- la structure doit rester migrable vers un modèle multi-établissements dans une version ultérieure, sans changer les rôles métier actuels

Colonnes :
- `id uuid PK`
- `user_id uuid NOT NULL UNIQUE FK -> profiles.user_id ON DELETE CASCADE`
- `establishment_type establishment_type_enum NOT NULL`
- `legal_name text NOT NULL`
- `display_name text NOT NULL`
- `description text NULL`
- `logo_url text NULL`
- `cover_image_url text NULL`
- `opening_hours jsonb NULL`
- `minimum_order_cents integer NOT NULL DEFAULT 0`
- `is_halal boolean NOT NULL DEFAULT false`
- `siret text NOT NULL`
- `address_line_1 text NOT NULL`
- `address_line_2 text NULL`
- `postal_code text NOT NULL`
- `city text NOT NULL`
- `country_code text NOT NULL`
- `latitude numeric(9,6) NOT NULL`
- `longitude numeric(9,6) NOT NULL`
- `validation_status partner_validation_status_enum NOT NULL DEFAULT 'pending'`
- `submitted_at timestamptz NOT NULL DEFAULT now()`
- `reviewed_at timestamptz NULL`
- `reviewed_by_admin_user_id uuid NULL FK -> profiles.user_id`
- `rc_pro_due_at timestamptz NOT NULL`
- `rc_pro_received_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `partner_documents`
Rôle : suivi des documents obligatoires.

Colonnes :
- `id uuid PK`
- `partner_id uuid NOT NULL FK -> partners.id ON DELETE CASCADE`
- `document_type partner_document_type_enum NOT NULL`
- `storage_path text NOT NULL`
- `verification_status partner_document_status_enum NOT NULL DEFAULT 'pending_review'`
- `submitted_at timestamptz NOT NULL DEFAULT now()`
- `reviewed_at timestamptz NULL`
- `reviewed_by_admin_user_id uuid NULL FK -> profiles.user_id`
- `rejection_reason text NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### 2.3 Courier

#### `couriers`
Rôle : compte livreur.

Colonnes :
- `id uuid PK`
- `user_id uuid NOT NULL UNIQUE FK -> profiles.user_id ON DELETE CASCADE`
- `validation_status courier_validation_status_enum NOT NULL DEFAULT 'pending'`
- `submitted_at timestamptz NOT NULL DEFAULT now()`
- `reviewed_at timestamptz NULL`
- `reviewed_by_admin_user_id uuid NULL FK -> profiles.user_id`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `courier_availabilities`
Rôle : créneaux de disponibilité du livreur.

Colonnes :
- `id uuid PK`
- `courier_id uuid NOT NULL FK -> couriers.id ON DELETE CASCADE`
- `starts_at timestamptz NOT NULL`
- `ends_at timestamptz NOT NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### 2.4 Catalogue

#### `categories`
Rôle : catégories visibles côté client.

Colonnes :
- `id uuid PK`
- `establishment_type establishment_type_enum NOT NULL`
- `name text NOT NULL`
- `is_active boolean NOT NULL DEFAULT true`
- `sort_order integer NOT NULL DEFAULT 0`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `products`
Rôle : produits gérés par le partner.

Colonnes :
- `id uuid PK`
- `partner_id uuid NOT NULL FK -> partners.id ON DELETE CASCADE`
- `category_id uuid NOT NULL FK -> categories.id`
- `name text NOT NULL`
- `description text NULL`
- `image_url text NULL`
- `partner_price_cents integer NOT NULL`
- `is_halal boolean NOT NULL DEFAULT false`
- `is_bestseller boolean NOT NULL DEFAULT false`
- `sort_order integer NOT NULL DEFAULT 0`
- `status product_status_enum NOT NULL DEFAULT 'active'`
- `is_available boolean NOT NULL DEFAULT true`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### 2.5 Panier

#### `carts`
Rôle : panier actif du client pour un partner donné.

Colonnes :
- `id uuid PK`
- `client_user_id uuid NOT NULL FK -> profiles.user_id ON DELETE CASCADE`
- `partner_id uuid NOT NULL FK -> partners.id ON DELETE CASCADE`
- `delivery_address_id uuid NULL FK -> client_addresses.id`
- `status cart_status_enum NOT NULL DEFAULT 'active'`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `cart_items`
Rôle : lignes de panier.

Colonnes :
- `id uuid PK`
- `cart_id uuid NOT NULL FK -> carts.id ON DELETE CASCADE`
- `product_id uuid NOT NULL FK -> products.id`
- `quantity integer NOT NULL`
- `unit_partner_price_cents integer NOT NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### 2.6 Livraison / frais

#### `delivery_zones`
Rôle : configuration admin des frais de livraison.

Colonnes :
- `id uuid PK`
- `name text NOT NULL`
- `city text NOT NULL`
- `geojson jsonb NOT NULL`
- `pricing_mode delivery_fee_model_enum NOT NULL DEFAULT 'zone_fixed'`
- `min_distance_km numeric(6,2) NULL`
- `max_distance_km numeric(6,2) NULL`
- `base_fee_cents integer NOT NULL`
- `minimum_fee_cents integer NOT NULL DEFAULT 0`
- `per_km_cents integer NULL`
- `is_default boolean NOT NULL DEFAULT false`
- `is_active boolean NOT NULL DEFAULT true`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### 2.7 Commandes

#### `orders`
Rôle : commande figée au checkout.

Colonnes :
- `id uuid PK`
- `client_user_id uuid NOT NULL FK -> profiles.user_id`
- `partner_id uuid NOT NULL FK -> partners.id`
- `delivery_address_id uuid NOT NULL FK -> client_addresses.id`
- `cart_id uuid NULL UNIQUE FK -> carts.id`
- `delivery_zone_id uuid NULL FK -> delivery_zones.id`
- `order_status order_status_enum NOT NULL DEFAULT 'pending_payment'`
- `item_count integer NOT NULL`
- `subtotal_partner_cents integer NOT NULL`
- `subtotal_customer_cents integer NOT NULL`
- `total_markup_cents integer NOT NULL`
- `courier_share_cents integer NOT NULL`
- `foodiz_share_cents integer NOT NULL`
- `loyalty_funding_cents integer NOT NULL`
- `referral_funding_cents integer NOT NULL`
- `service_fee_cents integer NOT NULL`
- `delivery_fee_cents integer NOT NULL`
- `total_customer_cents integer NOT NULL`
- `distance_km numeric(6,2) NULL`
- `placed_at timestamptz NOT NULL DEFAULT now()`
- `paid_at timestamptz NULL`
- `delivered_at timestamptz NULL`
- `cancelled_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `order_items`
Rôle : snapshot économique exact par article.

Colonnes :
- `id uuid PK`
- `order_id uuid NOT NULL FK -> orders.id ON DELETE CASCADE`
- `product_id uuid NOT NULL FK -> products.id`
- `product_name_snapshot text NOT NULL`
- `quantity integer NOT NULL`
- `markup_bracket smallint NOT NULL`
- `unit_partner_price_cents integer NOT NULL`
- `unit_markup_cents integer NOT NULL`
- `unit_customer_price_cents integer NOT NULL`
- `unit_courier_share_cents integer NOT NULL`
- `unit_foodiz_share_cents integer NOT NULL`
- `unit_loyalty_funding_cents integer NOT NULL`
- `unit_referral_funding_cents integer NOT NULL`
- `line_partner_subtotal_cents integer NOT NULL`
- `line_customer_subtotal_cents integer NOT NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`

#### `order_payments`
Rôle : paiement Stripe des commandes.

Colonnes :
- `id uuid PK`
- `order_id uuid NOT NULL UNIQUE FK -> orders.id ON DELETE CASCADE`
- `stripe_payment_intent_id text NOT NULL UNIQUE`
- `amount_cents integer NOT NULL`
- `currency_code char(3) NOT NULL DEFAULT 'EUR'`
- `status payment_status_enum NOT NULL DEFAULT 'pending'`
- `paid_at timestamptz NULL`
- `failed_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### 2.8 Livraison

#### `deliveries`
Rôle : suivi livraison et GPS lié à une commande.

Colonnes :
- `id uuid PK`
- `order_id uuid NOT NULL UNIQUE FK -> orders.id ON DELETE CASCADE`
- `courier_id uuid NULL FK -> couriers.id`
- `status delivery_status_enum NOT NULL DEFAULT 'pending_assignment'`
- `accepted_at timestamptz NULL`
- `pickup_confirmed_at timestamptz NULL`
- `delivered_at timestamptz NULL`
- `client_confirmed_at timestamptz NULL`
- `proof_image_url text NULL`
- `delivery_notes text NULL`
- `last_courier_lat numeric(9,6) NULL`
- `last_courier_lng numeric(9,6) NULL`
- `last_location_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Note de conformité MVP :
- ces champs supplémentaires n’ajoutent pas une nouvelle étape métier obligatoire
- le lifecycle officiel reste piloté par l’acceptation courier, la confirmation de récupération et la confirmation de livraison
- `client_confirmed_at` reste un champ optionnel de traçabilité tant qu’aucune règle métier supplémentaire n’est validée

### 2.9 Fidélité / parrainage / avis

#### `loyalty_accounts`
Rôle : solde points du client.

Colonnes :
- `client_user_id uuid PK FK -> profiles.user_id ON DELETE CASCADE`
- `points_balance integer NOT NULL DEFAULT 0`
- `total_points_earned integer NOT NULL DEFAULT 0`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `partner_reviews`
Rôle : avis client sur partner.

Colonnes :
- `id uuid PK`
- `order_id uuid NOT NULL UNIQUE FK -> orders.id ON DELETE CASCADE`
- `client_user_id uuid NOT NULL FK -> profiles.user_id`
- `partner_id uuid NOT NULL FK -> partners.id`
- `rating smallint NOT NULL`
- `comment text NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`

#### `courier_reviews`
Rôle : avis client sur courier.

Colonnes :
- `id uuid PK`
- `order_id uuid NOT NULL UNIQUE FK -> orders.id ON DELETE CASCADE`
- `client_user_id uuid NOT NULL FK -> profiles.user_id`
- `courier_id uuid NOT NULL FK -> couriers.id`
- `rating smallint NOT NULL`
- `comment text NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`

#### `satisfaction_responses`
Rôle : questionnaires satisfaction donnant des points fidélité.

Colonnes :
- `id uuid PK`
- `order_id uuid NOT NULL UNIQUE FK -> orders.id ON DELETE CASCADE`
- `client_user_id uuid NOT NULL FK -> profiles.user_id`
- `response_payload jsonb NOT NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`

#### `loyalty_transactions`
Rôle : traçabilité des gains de points.

Colonnes :
- `id uuid PK`
- `client_user_id uuid NOT NULL FK -> profiles.user_id ON DELETE CASCADE`
- `source loyalty_source_enum NOT NULL`
- `order_id uuid NULL UNIQUE FK -> orders.id`
- `partner_review_id uuid NULL UNIQUE FK -> partner_reviews.id`
- `courier_review_id uuid NULL UNIQUE FK -> courier_reviews.id`
- `satisfaction_response_id uuid NULL UNIQUE FK -> satisfaction_responses.id`
- `points integer NOT NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`

#### `referrals`
Rôle : relation de parrainage entre deux utilisateurs.

Colonnes :
- `id uuid PK`
- `referrer_user_id uuid NOT NULL FK -> profiles.user_id`
- `referred_user_id uuid NOT NULL UNIQUE FK -> profiles.user_id`
- `status referral_status_enum NOT NULL DEFAULT 'pending'`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### 2.10 Notifications

#### `notification_devices`
Rôle : tokens push par appareil.

Colonnes :
- `id uuid PK`
- `user_id uuid NOT NULL FK -> profiles.user_id ON DELETE CASCADE`
- `platform device_platform_enum NOT NULL`
- `push_token text NOT NULL UNIQUE`
- `is_active boolean NOT NULL DEFAULT true`
- `last_seen_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `partner_notification_pack_purchases`
Rôle : achats Stripe de packs campagnes.

Colonnes :
- `id uuid PK`
- `partner_id uuid NOT NULL FK -> partners.id ON DELETE CASCADE`
- `pack_type notification_pack_type_enum NOT NULL`
- `campaigns_included integer NOT NULL`
- `amount_cents integer NOT NULL`
- `stripe_payment_intent_id text NOT NULL UNIQUE`
- `payment_status payment_status_enum NOT NULL DEFAULT 'pending'`
- `purchased_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Rappel de mapping officiel :
- `discovery` => Pack Découverte
- `boost` => Pack Boost
- `performance` => Pack Performance

#### `partner_notification_campaigns`
Rôle : campagnes générées par IA pour un partner.

Colonnes :
- `id uuid PK`
- `partner_id uuid NOT NULL FK -> partners.id ON DELETE CASCADE`
- `status notification_campaign_status_enum NOT NULL DEFAULT 'draft'`
- `generated_content text NOT NULL`
- `tone_locked boolean NOT NULL DEFAULT true`
- `credits_consumed integer NOT NULL DEFAULT 1`
- `ai_score numeric(5,2) NULL`
- `gourmandise_score numeric(5,2) NULL`
- `elegance_score numeric(5,2) NULL`
- `clarity_score numeric(5,2) NULL`
- `soft_conversion_score numeric(5,2) NULL`
- `context_relevance_score numeric(5,2) NULL`
- `brand_safety_score numeric(5,2) NULL`
- `ai_score_details jsonb NULL`
- `sent_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `partner_notification_credit_ledger`
Rôle : ledger de crédits notifications.

Colonnes :
- `id uuid PK`
- `partner_id uuid NOT NULL FK -> partners.id ON DELETE CASCADE`
- `source_type notification_credit_source_enum NOT NULL`
- `pack_purchase_id uuid NULL FK -> partner_notification_pack_purchases.id`
- `campaign_id uuid NULL FK -> partner_notification_campaigns.id`
- `delta_credits integer NOT NULL`
- `balance_after integer NOT NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`

#### `notification_dispatches`
Rôle : traçabilité d’envoi des notifications.

Colonnes :
- `id uuid PK`
- `recipient_user_id uuid NOT NULL FK -> profiles.user_id ON DELETE CASCADE`
- `message_type notification_message_type_enum NOT NULL`
- `campaign_id uuid NULL FK -> partner_notification_campaigns.id ON DELETE SET NULL`
- `device_id uuid NULL FK -> notification_devices.id ON DELETE SET NULL`
- `message_body text NOT NULL`
- `status notification_dispatch_status_enum NOT NULL DEFAULT 'pending'`
- `provider_message_id text NULL`
- `error_message text NULL`
- `dispatched_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### 2.11 Finance / admin / logs

#### `partner_payouts`
Rôle : payouts partner gérés par admin.

Colonnes :
- `id uuid PK`
- `partner_id uuid NOT NULL FK -> partners.id ON DELETE CASCADE`
- `amount_cents integer NOT NULL`
- `period_start timestamptz NOT NULL`
- `period_end timestamptz NOT NULL`
- `status payout_status_enum NOT NULL DEFAULT 'pending'`
- `external_reference text NULL`
- `processed_by_admin_user_id uuid NULL FK -> profiles.user_id`
- `processed_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `courier_payouts`
Rôle : payouts courier gérés par admin.

Colonnes :
- `id uuid PK`
- `courier_id uuid NOT NULL FK -> couriers.id ON DELETE CASCADE`
- `amount_cents integer NOT NULL`
- `period_start timestamptz NOT NULL`
- `period_end timestamptz NOT NULL`
- `status payout_status_enum NOT NULL DEFAULT 'pending'`
- `external_reference text NULL`
- `processed_by_admin_user_id uuid NULL FK -> profiles.user_id`
- `processed_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `account_suspensions`
Rôle : historique de suspension des comptes.

Colonnes :
- `id uuid PK`
- `user_id uuid NOT NULL FK -> profiles.user_id ON DELETE CASCADE`
- `reason text NOT NULL`
- `imposed_by_admin_user_id uuid NULL FK -> profiles.user_id`
- `starts_at timestamptz NOT NULL DEFAULT now()`
- `ends_at timestamptz NULL`
- `is_active boolean NOT NULL DEFAULT true`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

#### `admin_action_logs`
Rôle : journalisation des actions sensibles admin.

Colonnes :
- `id uuid PK`
- `admin_user_id uuid NOT NULL FK -> profiles.user_id`
- `action_type text NOT NULL`
- `target_table text NOT NULL`
- `target_id uuid NULL`
- `payload jsonb NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`

#### `domain_events`
Rôle : backbone d’événements applicatifs.

Colonnes :
- `id uuid PK`
- `event_name text NOT NULL`
- `aggregate_type text NOT NULL`
- `aggregate_id uuid NOT NULL`
- `source text NOT NULL`
- `idempotency_key text NULL UNIQUE`
- `payload jsonb NOT NULL`
- `emitted_at timestamptz NOT NULL DEFAULT now()`
- `processed_at timestamptz NULL`

### 2.12 Vues SQL officielles

Ces vues ne créent pas de nouvelles fonctionnalités ; elles servent à exposer les données déjà présentes.

- `partner_revenue_view`
- `courier_revenue_view`
- `partner_stats_view`
- `courier_stats_view`
- `admin_global_stats_view`
- `order_read_model_view`

Le détail exact de chaque vue sera dérivé des tables ci-dessus sans ajouter de métriques non prévues par le MASTER SPEC.

---

## 3. Relations SQL exactes

### 3.1 Relations cœur identité
- `auth.users.id 1---1 profiles.user_id`
- `profiles.user_id 1---N client_addresses.client_user_id`
- `profiles.user_id 1---0..1 partners.user_id`
- `profiles.user_id 1---0..1 couriers.user_id`
- `profiles.user_id 1---N notification_devices.user_id`
- `profiles.user_id 1---N account_suspensions.user_id`
- `profiles.user_id 1---N admin_action_logs.admin_user_id`
- `profiles.user_id 1---N referrals.referrer_user_id`
- `profiles.user_id 1---0..1 referrals.referred_user_id`
- `profiles.user_id 1---0..1 loyalty_accounts.client_user_id`
- `profiles.user_id 1---N loyalty_transactions.client_user_id`

### 3.2 Relations partner
- `partners.id 1---N partner_documents.partner_id`
- `partners.id 1---N products.partner_id`
- `partners.id 1---N carts.partner_id`
- `partners.id 1---N orders.partner_id`
- `partners.id 1---N partner_reviews.partner_id`
- `partners.id 1---N partner_notification_pack_purchases.partner_id`
- `partners.id 1---N partner_notification_campaigns.partner_id`
- `partners.id 1---N partner_notification_credit_ledger.partner_id`
- `partners.id 1---N partner_payouts.partner_id`

### 3.3 Relations courier
- `couriers.id 1---N courier_availabilities.courier_id`
- `couriers.id 1---N deliveries.courier_id`
- `couriers.id 1---N courier_reviews.courier_id`
- `couriers.id 1---N courier_payouts.courier_id`

### 3.4 Relations catalogue
- `categories.id 1---N products.category_id`

### 3.5 Relations panier / commande
- `carts.id 1---N cart_items.cart_id`
- `carts.id 1---0..1 orders.cart_id`
- `products.id 1---N cart_items.product_id`
- `orders.id 1---N order_items.order_id`
- `products.id 1---N order_items.product_id`
- `orders.id 1---1 order_payments.order_id`
- `orders.id 1---1 deliveries.order_id`
- `delivery_zones.id 1---N orders.delivery_zone_id`
- `client_addresses.id 1---N carts.delivery_address_id`
- `client_addresses.id 1---N orders.delivery_address_id`

### 3.6 Relations avis / fidélité
- `orders.id 1---0..1 partner_reviews.order_id`
- `orders.id 1---0..1 courier_reviews.order_id`
- `orders.id 1---0..1 satisfaction_responses.order_id`
- `orders.id 1---0..1 loyalty_transactions.order_id`
- `partner_reviews.id 1---0..1 loyalty_transactions.partner_review_id`
- `courier_reviews.id 1---0..1 loyalty_transactions.courier_review_id`
- `satisfaction_responses.id 1---0..1 loyalty_transactions.satisfaction_response_id`

### 3.7 Relations notifications
- `partner_notification_pack_purchases.id 1---N partner_notification_credit_ledger.pack_purchase_id`
- `partner_notification_campaigns.id 1---N partner_notification_credit_ledger.campaign_id`
- `partner_notification_campaigns.id 1---N notification_dispatches.campaign_id`
- `notification_devices.id 1---N notification_dispatches.device_id`
- `profiles.user_id 1---N notification_dispatches.recipient_user_id`

### 3.8 Relations admin / finance
- `profiles.user_id 1---N partners.reviewed_by_admin_user_id`
- `profiles.user_id 1---N couriers.reviewed_by_admin_user_id`
- `profiles.user_id 1---N partner_documents.reviewed_by_admin_user_id`
- `profiles.user_id 1---N partner_payouts.processed_by_admin_user_id`
- `profiles.user_id 1---N courier_payouts.processed_by_admin_user_id`
- `profiles.user_id 1---N account_suspensions.imposed_by_admin_user_id`

---

## 4. Contraintes et index

### 4.1 Contraintes globales
- tous les rôles sont validés via `profiles.role`
- un user ne peut avoir qu’un seul `partner` via `UNIQUE(partners.user_id)`
- un user ne peut avoir qu’un seul `courier` via `UNIQUE(couriers.user_id)`
- un `partner` ne peut avoir qu’un document actif par type via `UNIQUE(partner_id, document_type)`
- un `order` ne peut avoir qu’un `payment` via `UNIQUE(order_id)` sur `order_payments`
- un `order` ne peut avoir qu’une `delivery` via `UNIQUE(order_id)` sur `deliveries`
- un `order` ne peut avoir qu’un avis partner, un avis courier et une réponse satisfaction via contraintes `UNIQUE(order_id)`
- un `referred_user` ne peut être rattaché qu’à un seul parrain via `UNIQUE(referred_user_id)`

### 4.2 Contraintes métier SQL
- `products.partner_price_cents >= 50`
- `partners.minimum_order_cents >= 0`
- `cart_items.quantity > 0`
- `order_items.quantity > 0`
- `partner_reviews.rating BETWEEN 1 AND 5`
- `courier_reviews.rating BETWEEN 1 AND 5`
- `partner_payouts.amount_cents > 0`
- `courier_payouts.amount_cents > 0`
- `courier_availabilities.ends_at > courier_availabilities.starts_at`
- `partner_notification_campaigns.credits_consumed = 1`
- `orders.item_count > 0`
- `delivery_zones.base_fee_cents >= 0`
- `delivery_zones.minimum_fee_cents >= 0`
- `delivery_zones.per_km_cents IS NULL OR delivery_zones.per_km_cents >= 0`
- `delivery_zones.max_distance_km IS NULL OR delivery_zones.min_distance_km IS NULL OR delivery_zones.max_distance_km >= delivery_zones.min_distance_km`
- tous les champs `*_cents` doivent être `>= 0`
- `order_items.markup_bracket IN (1,2,3)`
- `partner_notification_credit_ledger.delta_credits <> 0`
- `partner_notification_credit_ledger.balance_after >= 0`

### 4.3 Contraintes de cohérence applicative
Ces contraintes sont exécutées par services backend ou triggers SQL, car elles dépendent de plusieurs tables.

- `products.category_id` doit référencer une catégorie du même `establishment_type` que le `partner`
- `carts.partner_id` impose que tous les `cart_items` appartiennent à des `products` du même `partner`
- `orders` sont créées uniquement depuis un `cart` valide
- `order` et `delivery` partagent toujours le même périmètre métier
- `partner_reviews`, `courier_reviews` et `satisfaction_responses` ne peuvent être créés que pour des `orders` livrées
- la création des `loyalty_transactions` doit être idempotente par source
- `partner_notification_campaigns` ne peuvent être envoyées que si le ledger de crédits est suffisant
- le modèle économique est calculé article par article et non au niveau du panier global, du total commande ou du restaurant

### 4.4 Index recommandés

#### Identité / recherche utilisateur
- `profiles(role)`
- `profiles(account_status)`
- `profiles(email)` unique
- `profiles(referral_code)` unique
- `profiles(referred_by_user_id)`

#### Partner / courier
- `partners(validation_status)`
- `partners(establishment_type)`
- `partners(siret)`
- `partners(city, postal_code)`
- `products(sort_order)`
- `couriers(validation_status)`

#### Documents
- `partner_documents(partner_id, document_type)` unique
- `partner_documents(verification_status)`
- `partner_documents(submitted_at DESC)`

#### Catalogue
- `categories(establishment_type, is_active, sort_order)`
- `UNIQUE(lower(name), establishment_type)` sur `categories`
- `products(partner_id, status, is_available)`
- `products(partner_id, sort_order)`
- `products(partner_id, is_bestseller)`
- `products(partner_id, is_halal)`
- `products(category_id)`
- index trigram ou full-text sur `products.name`

#### Paniers / commandes
- index partiel unique sur `carts(client_user_id, partner_id)` where `status = 'active'`
- `cart_items(cart_id)`
- `UNIQUE(cart_id, product_id)` sur `cart_items`
- `orders(client_user_id, created_at DESC)`
- `orders(partner_id, order_status, created_at DESC)`
- `orders(delivery_zone_id)`
- `orders(order_status, created_at DESC)`
- `order_items(order_id)`
- `order_payments(status)`
- `order_payments(stripe_payment_intent_id)` unique

#### Livraison
- `delivery_zones(city, is_active)`
- `delivery_zones(city, is_default)`
- `deliveries(courier_id, status)`
- `deliveries(order_id)` unique
- `deliveries(status, updated_at DESC)`
- `courier_availabilities(courier_id, starts_at, ends_at)`

#### Fidélité / parrainage / avis
- `loyalty_transactions(client_user_id, created_at DESC)`
- `referrals(referrer_user_id)`
- `referrals(status)`
- `partner_reviews(partner_id, created_at DESC)`
- `courier_reviews(courier_id, created_at DESC)`

#### Notifications
- `notification_devices(user_id, is_active)`
- `notification_devices(push_token)` unique
- `partner_notification_pack_purchases(partner_id, created_at DESC)`
- `partner_notification_pack_purchases(stripe_payment_intent_id)` unique
- `partner_notification_campaigns(partner_id, status, created_at DESC)`
- `partner_notification_campaigns(partner_id, sent_at DESC)`
- `partner_notification_credit_ledger(partner_id, created_at DESC)`
- `notification_dispatches(recipient_user_id, created_at DESC)`
- `notification_dispatches(status, created_at DESC)`

#### Admin / logs / events
- `partner_payouts(partner_id, status, created_at DESC)`
- `courier_payouts(courier_id, status, created_at DESC)`
- index partiel sur `account_suspensions(user_id)` where `is_active = true`
- `admin_action_logs(admin_user_id, created_at DESC)`
- `admin_action_logs(target_table, target_id)`
- `domain_events(aggregate_type, aggregate_id, emitted_at DESC)`
- `domain_events(idempotency_key)` unique where not null

---

## 5. Architecture RLS Supabase

### 5.1 Principe général
RLS est activé sur toutes les tables applicatives du schéma public.  
Le `service_role` n’est utilisé que côté backend sécurisé.

### 5.2 Fonctions d’aide RLS
Fonctions SQL helper attendues :
- `current_user_role()`
- `is_admin()`
- `is_client()`
- `is_partner()`
- `is_courier()`
- `owns_partner(partner_id)`
- `owns_courier(courier_id)`
- `owns_order(order_id)`

Ces helpers encapsulent les vérifications sur `profiles`, `partners`, `couriers` et évitent de dupliquer une logique fragile dans chaque policy.

### 5.3 Matrice RLS par table

#### `profiles`
- `SELECT`: utilisateur sur sa propre ligne ; admin sur toutes les lignes
- `UPDATE`: utilisateur sur sa propre ligne hors champs protégés ; admin sur toutes les lignes
- `INSERT`: via trigger backend post-signup uniquement
- `DELETE`: interdit en client direct

#### `client_addresses`
- `SELECT/INSERT/UPDATE/DELETE`: propriétaire uniquement
- `SELECT/UPDATE`: admin autorisé

#### `partners`
- `SELECT`: owner partner sur sa ligne ; admin sur toutes ; client authentifié sur partners `approved` uniquement
- `UPDATE`: owner partner sur ses champs métier autorisés ; admin sur tout
- `INSERT`: partner owner ou backend lors onboarding
- `DELETE`: backend/admin uniquement

#### `partner_documents`
- `SELECT`: partner propriétaire et admin
- `INSERT`: partner propriétaire
- `UPDATE`: partner propriétaire sur re-upload ; admin sur revue/validation
- `DELETE`: admin uniquement

#### `couriers`
- `SELECT`: courier propriétaire et admin
- `UPDATE`: courier propriétaire sur ses champs autorisés ; admin sur tout
- `INSERT`: courier owner ou backend onboarding
- `DELETE`: admin uniquement

#### `courier_availabilities`
- `SELECT/INSERT/UPDATE/DELETE`: courier propriétaire
- `SELECT/UPDATE`: admin

#### `categories`
- `SELECT`: utilisateurs authentifiés
- `INSERT/UPDATE/DELETE`: admin uniquement

#### `products`
- `SELECT`: client authentifié si partner `approved` et produit `active` + `is_available = true`; partner owner ; admin
- `INSERT/UPDATE/DELETE`: partner owner sur ses produits ; admin

#### `carts`
- `SELECT/INSERT/UPDATE/DELETE`: client propriétaire uniquement
- `SELECT`: admin

#### `cart_items`
- `SELECT/INSERT/UPDATE/DELETE`: client propriétaire du panier uniquement
- `SELECT`: admin

#### `delivery_zones`
- `SELECT`: backend/service et admin
- `INSERT/UPDATE/DELETE`: admin uniquement

#### `orders`
- `SELECT`: client propriétaire ; partner owner du `partner_id` ; courier assigné via `deliveries` ; admin
- `INSERT`: backend/service uniquement
- `UPDATE`: backend/service ; partner/admin/courier uniquement via services contrôlés, pas en direct client
- `DELETE`: interdit

#### `order_items`
- `SELECT`: client propriétaire via `orders` ; partner owner via `orders` ; courier assigné via `orders`/`deliveries` ; admin
- `INSERT/UPDATE/DELETE`: backend/service uniquement

#### `order_payments`
- `SELECT`: client propriétaire via `orders` ; admin
- `INSERT/UPDATE`: backend/service uniquement
- `DELETE`: interdit

#### `deliveries`
- `SELECT`: client propriétaire via `orders` ; partner owner via `orders` ; courier assigné ; admin
- `INSERT`: backend/service uniquement
- `UPDATE`: courier assigné sur champs de suivi autorisés ; backend/service ; admin
- `DELETE`: interdit

#### `loyalty_accounts`
- `SELECT`: client propriétaire ; admin
- `INSERT/UPDATE`: backend/service uniquement
- `DELETE`: interdit

#### `partner_reviews`
- `SELECT`: client auteur ; partner concerné ; admin
- `INSERT`: client propriétaire de la commande uniquement
- `UPDATE/DELETE`: admin uniquement

#### `courier_reviews`
- `SELECT`: client auteur ; courier concerné ; admin
- `INSERT`: client propriétaire de la commande uniquement
- `UPDATE/DELETE`: admin uniquement

#### `satisfaction_responses`
- `SELECT`: client auteur ; admin
- `INSERT`: client propriétaire de la commande uniquement
- `UPDATE/DELETE`: admin uniquement

#### `loyalty_transactions`
- `SELECT`: client propriétaire ; admin
- `INSERT`: backend/service uniquement
- `UPDATE/DELETE`: interdit

#### `referrals`
- `SELECT`: referrer ou referred user ; admin
- `INSERT`: backend/service ou signup flow contrôlé
- `UPDATE`: backend/service ; admin
- `DELETE`: admin uniquement

#### `notification_devices`
- `SELECT/INSERT/UPDATE/DELETE`: propriétaire du token
- `SELECT`: admin

#### `partner_notification_pack_purchases`
- `SELECT`: partner owner ; admin
- `INSERT/UPDATE`: backend/service uniquement
- `DELETE`: interdit

#### `partner_notification_campaigns`
- `SELECT`: partner owner ; admin
- `INSERT/UPDATE`: backend/service uniquement
- `DELETE`: admin uniquement

#### `partner_notification_credit_ledger`
- `SELECT`: partner owner ; admin
- `INSERT`: backend/service uniquement
- `UPDATE/DELETE`: interdit

#### `notification_dispatches`
- `SELECT`: admin ; éventuellement destinataire si inbox future validée
- `INSERT/UPDATE`: backend/service uniquement
- `DELETE`: admin uniquement

#### `partner_payouts`
- `SELECT`: partner owner ; admin
- `INSERT/UPDATE`: admin/backend uniquement
- `DELETE`: admin uniquement

#### `courier_payouts`
- `SELECT`: courier owner ; admin
- `INSERT/UPDATE`: admin/backend uniquement
- `DELETE`: admin uniquement

#### `account_suspensions`
- `SELECT`: utilisateur concerné et admin
- `INSERT/UPDATE`: admin/backend uniquement
- `DELETE`: admin uniquement

#### `admin_action_logs`
- `SELECT`: admin uniquement
- `INSERT`: backend/admin service uniquement
- `UPDATE/DELETE`: interdit

#### `domain_events`
- `SELECT`: admin/backend uniquement
- `INSERT`: backend/service uniquement
- `UPDATE`: backend async workers uniquement
- `DELETE`: interdit

### 5.4 Règle clé RLS
Toutes les opérations qui touchent :
- les prix
- les calculs économiques
- les validations
- les paiements
- les crédits de notifications
- les payouts
- les changements de statuts sensibles

sont **interdites en écriture directe depuis le frontend** et passent par des services backend privilégiés.

---

## 6. Storage architecture

### 6.1 Bucket officiel requis
Le bucket explicitement requis par le MASTER SPEC est :

#### `partner-documents-private`
Usage :
- SIRET
- pièce identité
- KBIS
- RC PRO

Règles :
- bucket privé
- chemin canonical : `partners/{partner_id}/{document_type}/{uuid}.{ext}`
- upload autorisé uniquement au partner propriétaire authentifié
- lecture uniquement via URL signée
- accès admin autorisé via service backend
- jamais de lecture publique

### 6.2 Métadonnées de fichiers
Les métadonnées de validation ne vivent pas dans le bucket mais dans `partner_documents` :
- type du document
- statut de vérification
- reviewer admin
- motif de rejet
- horodatages

### 6.3 Règles sécurité storage
- vérifier MIME type autorisé côté backend
- vérifier taille maximale côté backend
- renommer systématiquement côté serveur
- bloquer l’exposition directe des chemins privés
- utiliser uniquement des signed URLs courtes pour la consultation

### 6.4 Gouvernance storage
- les documents partner restent privés conformément au MASTER SPEC
- aucun bucket supplémentaire n’est ajouté dans ce blueprint sans validation explicite du MASTER SPEC

---

## 7. Workflows backend complets

### 7.1 Onboarding client
1. création `auth.users`
2. vérification email via Supabase Auth
3. création `profiles` avec `role = client`
4. génération `referral_code`
5. création `loyalty_accounts`
6. ajout facultatif d’une première adresse dans `client_addresses`
7. émission `domain_event = client.created`

### 7.2 Onboarding partner
1. création `auth.users`
2. vérification email
3. création `profiles` avec `role = partner`
4. création `partners` avec `validation_status = pending`
5. calcul `rc_pro_due_at = signup + 7 jours`
6. upload des documents obligatoires dans storage privé
7. création/maj `partner_documents` pour `siret`, `identity_document`, `kbis`
8. émission `domain_event = partner.submitted`
9. notification admin de validation en attente
10. admin approuve ou rejette
11. si approuvé, `partners.validation_status = approved`
12. si rejeté, `partners.validation_status = rejected`
13. réception RC PRO avant échéance => document `rc_pro` approuvé + `rc_pro_received_at`
14. si RC PRO absent après 7 jours => suspension ou suppression selon règle admin/système + `account_suspensions`

### 7.3 Onboarding courier
1. création `auth.users`
2. vérification email
3. création `profiles` avec `role = courier`
4. création `couriers` avec `validation_status = pending`
5. émission `domain_event = courier.submitted`
6. validation admin obligatoire
7. si approuvé, `couriers.validation_status = approved`
8. si rejeté, `couriers.validation_status = rejected`

### 7.4 Gestion de catalogue partner
1. partner approuvé se connecte
2. CRUD sur `products`
3. contrôle backend : catégorie compatible avec `establishment_type`
4. émission `domain_event = product.created|updated|deleted`

### 7.5 Workflow panier -> commande
1. client crée ou réutilise un `cart` actif lié à un seul `partner`
2. ajout de `cart_items`
3. snapshots `unit_partner_price_cents` stockés dans le panier
4. au checkout, le backend recharge les produits source
5. le backend calcule :
   - tranche par article
   - markup par article
   - répartition courier / Foodiz / fidélité / parrainage
   - service fee selon nombre d’articles
   - delivery fee selon zone + distance si applicable
6. le backend crée `orders` + `order_items` + `order_payments(status=pending)` dans une transaction atomique
7. le backend crée `deliveries(status=pending_assignment)`
8. le backend crée le `Stripe PaymentIntent`
9. le client paie
10. webhook Stripe confirme le paiement
11. `order_payments.status = succeeded`
12. `orders.order_status = paid`
13. `carts.status = converted`
14. émission `domain_event = order.paid`
15. notification partner et admin si nécessaire

### 7.6 Gestion partner des commandes
1. partner consulte ses `orders`
2. lorsqu’il commence le traitement : `order_status = in_preparation`
3. lorsque la commande est prête : `order_status = ready_for_pickup`
4. émission d’événements pour alerter l’assignation courier

Ces statuts intermédiaires sont des états techniques nécessaires pour supporter la chaîne officielle partner -> courier -> livraison.

### 7.7 Assignation courier
1. `delivery.status = pending_assignment`
2. seuls les couriers `approved` peuvent voir les livraisons éligibles
3. courier accepte ou refuse
4. en cas d’acceptation :
   - `deliveries.courier_id = courier.id`
   - `deliveries.status = courier_assigned`
   - `deliveries.accepted_at = now()`
   - `orders.order_status = courier_assigned`
5. en cas de refus :
   - aucun changement terminal de commande
   - émission d’événement `delivery.refused`
   - la livraison reste réassignable

### 7.8 Pickup et livraison
1. courier confirmé assigne met à jour sa position GPS
2. courier confirme récupération :
   - `deliveries.status = picked_up`
   - `deliveries.pickup_confirmed_at = now()`
   - `orders.order_status = picked_up`
3. courier confirme livraison :
   - `deliveries.status = delivered`
   - `deliveries.delivered_at = now()`
   - `orders.order_status = delivered`
   - `orders.delivered_at = now()`
4. `proof_image_url` et `delivery_notes` peuvent être renseignés sans modifier le lifecycle officiel
5. émission `domain_event = order.delivered`
6. déverrouillage avis + satisfaction + fidélité

### 7.9 Workflow fidélité
1. source officielle détectée :
   - commande livrée
   - avis partner créé
   - avis courier créé
   - satisfaction response créée
2. backend vérifie idempotence
3. backend crée `loyalty_transactions`
4. backend incrémente `loyalty_accounts.points_balance`
5. émission `domain_event = loyalty.earned`

Le nombre exact de points n’étant pas défini dans le MASTER SPEC, il reste un paramètre métier à valider ultérieurement sans modifier l’architecture.

### 7.10 Workflow parrainage
1. un client possède un `referral_code`
2. à l’inscription, un utilisateur peut être relié à `referred_by_user_id`
3. création ou mise à jour `referrals`
4. les conditions exactes de passage à `rewarded` ne sont pas inventées ici
5. émission `domain_event = referral.created|rewarded`

### 7.11 Workflow achat pack notifications
1. partner approuvé choisit un pack : `discovery`, `boost` ou `performance`
2. correspondance officielle : Découverte, Boost, Performance
3. backend crée `partner_notification_pack_purchases(status=pending)`
4. backend crée un `Stripe PaymentIntent`
5. Stripe webhook confirme paiement
6. `payment_status = succeeded`
7. `purchased_at = now()`
8. backend crédite `partner_notification_credit_ledger` du nombre de campagnes incluses
9. émission `domain_event = notification_pack.purchased`

### 7.12 Workflow campagne IA partner
1. partner demande une campagne
2. backend vérifie qu’il reste au moins 1 crédit
3. génération IA via service dédié
4. le ton est forcé : gourmand, élégant, chaleureux, jamais cheap, jamais agressif
5. création `partner_notification_campaigns(status=generated)`
6. scoring IA enregistré dans :
   - `ai_score`
   - `gourmandise_score`
   - `elegance_score`
   - `clarity_score`
   - `soft_conversion_score`
   - `context_relevance_score`
   - `brand_safety_score`
   - `ai_score_details`
7. débit `partner_notification_credit_ledger` avec `delta_credits = -1`
8. envoi push aux destinataires ciblés par la logique de campagne validée en implémentation
9. création `notification_dispatches`
10. `partner_notification_campaigns.status = sent`
11. émission `domain_event = campaign.sent`

Le provider IA n’est volontairement pas figé dans ce blueprint car il n’est pas spécifié dans le MASTER SPEC.

### 7.13 Workflow admin validation partner
1. admin consulte dossier partner
2. admin vérifie documents
3. admin approuve ou rejette chaque document
4. admin approuve ou rejette le compte
5. écriture `admin_action_logs`
6. émission `domain_event = partner.approved|rejected|suspended`

### 7.14 Workflow admin validation courier
1. admin consulte dossier courier
2. admin approuve ou rejette
3. écriture `admin_action_logs`
4. émission `domain_event = courier.approved|rejected|suspended`

### 7.15 Workflow admin payouts
1. admin consulte `partner_revenue_view` et `courier_revenue_view`
2. admin crée un `partner_payouts` ou `courier_payouts`
3. admin traite le payout via le canal financier retenu hors MASTER SPEC
4. admin marque `status = paid`
5. sauvegarde `external_reference`
6. écriture `admin_action_logs`
7. émission `domain_event = payout.paid`

---

## 8. Stripe architecture

### 8.1 Périmètre Stripe officiel
Stripe est utilisé pour :
- paiement des commandes client
- paiement des packs notifications partner

Aucun usage Stripe Connect pour les payouts n’est figé dans ce blueprint, car le MASTER SPEC ne l’impose pas.

### 8.2 Architecture paiement commandes
Composants :
- service backend `checkout-service`
- table `orders`
- table `order_items`
- table `order_payments`
- webhook Stripe sécurisé

Séquence :
1. backend calcule le montant autoritaire article par article
2. backend crée `orders` et `order_payments(status=pending)`
3. backend crée un `PaymentIntent Stripe`
4. frontend reçoit uniquement le `client_secret`
5. Stripe confirme via webhook signé
6. backend met à jour `order_payments` et `orders`

### 8.3 Architecture paiement packs notifications
Composants :
- service backend `partner-notification-billing-service`
- table `partner_notification_pack_purchases`
- table `partner_notification_credit_ledger`
- webhook Stripe sécurisé

Séquence :
1. backend crée une intention d’achat pack
2. Stripe encaisse
3. webhook met à jour `payment_status = succeeded`
4. backend crédite le ledger

### 8.4 Règles Stripe obligatoires
- aucun montant fourni par le frontend n’est considéré comme source de vérité
- tous les montants sont recalculés côté backend
- tous les webhooks sont vérifiés par signature
- toutes les écritures Stripe sont idempotentes
- les IDs Stripe sont stockés et indexés en base

---

## 9. Order lifecycle

### 9.1 États officiels
`pending_payment -> paid -> in_preparation -> ready_for_pickup -> courier_assigned -> picked_up -> delivered`

État terminal alternatif :
- `cancelled`

### 9.2 Transitions autorisées
- `pending_payment -> paid`
- `pending_payment -> cancelled`
- `paid -> in_preparation`
- `paid -> cancelled`
- `in_preparation -> ready_for_pickup`
- `in_preparation -> cancelled`
- `ready_for_pickup -> courier_assigned`
- `ready_for_pickup -> cancelled`
- `courier_assigned -> picked_up`
- `courier_assigned -> cancelled`
- `picked_up -> delivered`

### 9.3 Source autorisée par transition
- `pending_payment -> paid` : webhook Stripe / backend
- `paid -> in_preparation` : partner via service contrôlé
- `in_preparation -> ready_for_pickup` : partner via service contrôlé
- `ready_for_pickup -> courier_assigned` : courier acceptation / backend
- `courier_assigned -> picked_up` : courier via service contrôlé
- `picked_up -> delivered` : courier via service contrôlé
- `cancelled` : admin/backend selon règle opérationnelle

### 9.4 Snapshots order obligatoires
Au moment de création de commande, les valeurs ci-dessous sont figées et ne doivent plus dépendre des produits après paiement :
- prix partner par article
- markup par article
- prix client par article
- part courier / Foodiz / fidélité / parrainage par article
- service fee
- delivery fee
- distance retenue
- total final client

### 9.5 Rappel conformité économique
- le modèle économique est calculé **par article**
- il ne s’applique pas au panier global
- il ne s’applique pas au total commande
- il ne s’applique pas au restaurant dans son ensemble

---

## 10. Delivery lifecycle

### 10.1 États officiels
`pending_assignment -> courier_assigned -> picked_up -> delivered`

État terminal alternatif :
- `cancelled`

### 10.2 Règles métier techniques
- une `delivery` existe pour chaque `order`
- une `delivery` n’a qu’un seul courier assigné à la fois
- un refus courier n’est pas un état terminal ; il génère un événement puis retour à l’assignation
- le suivi GPS n’est autorisé que pour le courier assigné
- `proof_image_url`, `delivery_notes` et `client_confirmed_at` ne modifient pas le lifecycle officiel validé dans le MASTER SPEC

### 10.3 Données temps réel
La `delivery` porte uniquement le dernier point GPS utile :
- `last_courier_lat`
- `last_courier_lng`
- `last_location_at`

Le stream temps réel détaillé passe par le système d’événements / notifications temps réel ; il n’est pas nécessaire de persister chaque ping en base pour le MVP.

### 10.4 Transitions autorisées
- `pending_assignment -> courier_assigned`
- `courier_assigned -> picked_up`
- `picked_up -> delivered`
- `pending_assignment -> cancelled`
- `courier_assigned -> cancelled`

---

## 11. Admin architecture

### 11.1 Surface admin
L’admin dispose d’une interface Next.js séparée logiquement, protégée par :
- authentification Supabase
- contrôle de rôle `admin`
- middleware serveur
- vérification RLS + services backend

### 11.2 Modules admin officiels
- dashboard global
- gestion utilisateurs
- gestion partenaires
- validation partners
- suivi documents partner
- gestion livreurs
- validation couriers
- gestion commandes
- gestion fidélité
- gestion notifications
- gestion payouts
- gestion revenus
- statistiques globales
- suspension comptes
- logs admin
- paramétrage frais de livraison par zones

### 11.3 Lecture admin
L’admin lit préférentiellement :
- tables cœur pour le détail
- vues SQL pour revenus et stats
- `admin_action_logs`
- `domain_events`

### 11.4 Écriture admin
Toutes les mutations admin sensibles passent par des services backend signés :
- approbation/rejet partner
- approbation/rejet courier
- suspension compte
- création/confirmation payout
- changement de statuts sensibles
- modification zones de livraison

### 11.5 Audit admin
Chaque action admin critique écrit :
- un log dans `admin_action_logs`
- un événement dans `domain_events`

### 11.6 Rappel conformité admin
- validation admin partner obligatoire
- validation admin courier obligatoire
- gestion des documents partner privés obligatoire

---

## 12. Notifications architecture

### 12.1 Deux familles de notifications
#### A. Notifications transactionnelles
Supportent les flux déjà présents dans le produit :
- validation partner/courier
- paiement commande
- progression commande
- progression livraison

#### B. Notifications partner campaign
- campagnes IA payantes
- consommation de crédits par campagne
- ton imposé par la marque Foodiz

### 12.2 Pipeline push
1. appareil enregistre un token dans `notification_devices`
2. backend détermine les destinataires
3. backend crée `notification_dispatches(status=pending)`
4. backend envoie via Expo Notifications / Firebase
5. backend marque `sent` ou `failed`

### 12.3 Gouvernance de contenu IA
Pour les campagnes partner :
- génération via service dédié
- ton verrouillé techniquement
- contenu stocké dans `partner_notification_campaigns.generated_content`
- scoring IA stocké dans les champs dédiés de `partner_notification_campaigns`
- impossible de créditer/débiter le ledger depuis le frontend

### 12.4 Administration notifications
L’admin peut :
- superviser les campagnes
- voir les achats de packs
- voir les dispatches
- gérer les notifications au niveau plateforme

---

## 13. Frontend architecture

### 13.1 Répartition des surfaces
#### `apps/mobile`
Application React Native + Expo.

Rôles servis :
- client
- courier

Justification technique :
- le client doit commander et suivre la livraison
- le courier doit gérer acceptation, GPS, récupération et livraison sur mobile

#### `apps/web`
Application Next.js.

Surfaces servies :
- site web Foodiz.co
- interface partner
- panel admin

### 13.2 Packages partagés recommandés
- `packages/ui-tokens`
- `packages/types`
- `packages/api-client`
- `packages/business-rules`
- `packages/config`

Ces packages n’ajoutent aucune fonctionnalité ; ils servent à garantir cohérence et maintenabilité.

### 13.3 Navigation par rôle
Le frontend utilise un route guard central basé sur :
- session Supabase
- `profiles.role`
- `profiles.account_status`
- `partners.validation_status` si rôle partner
- `couriers.validation_status` si rôle courier

### 13.4 Accès frontend direct vs via service
#### Direct Supabase + RLS
Pour :
- profil
- adresses
- lecture catalogue
- disponibilité courier
- lecture commandes selon rôle
- lecture revenus/stats selon vues autorisées

#### Services backend obligatoires
Pour :
- checkout
- calcul économique
- création `orders`
- Stripe
- validations admin
- suspension comptes
- crédits notifications
- génération IA
- payouts
- transitions de statuts sensibles

---

## 14. API / services architecture

### 14.1 Principe
L’architecture API est hybride :
- accès direct Supabase pour le CRUD simple protégé par RLS
- couche services backend pour toute logique sensible

### 14.2 Services backend officiels
- `auth-service`
- `profile-service`
- `catalog-service`
- `cart-service`
- `pricing-service`
- `checkout-service`
- `order-service`
- `delivery-service`
- `loyalty-service`
- `referral-service`
- `partner-onboarding-service`
- `partner-notification-service`
- `partner-notification-billing-service`
- `admin-service`
- `payout-service`
- `webhook-service`
- `logging-service`

### 14.3 Responsabilités exactes
#### `pricing-service`
- calcule tranche par article
- calcule markup invisible Foodiz
- calcule répartition courier / Foodiz / fidélité / parrainage
- calcule service fee par nombre d’articles
- calcule delivery fee selon zone et distance

#### `checkout-service`
- transforme un panier en commande atomique
- crée `orders`, `order_items`, `order_payments`, `deliveries`
- parle à Stripe

#### `order-service`
- applique les transitions de statuts order
- sécurise la visibilité par rôle
- publie les événements métier

#### `delivery-service`
- gère assignation courier
- gère acceptation/refus
- gère GPS
- gère pickup/delivery confirmation

#### `partner-notification-service`
- génère les campagnes IA
- contrôle le ton de marque
- enregistre le scoring IA
- décrémente les crédits
- crée les dispatches

#### `admin-service`
- validation partner/courier
- suspension compte
- gestion delivery zones
- mutations sensibles admin

#### `payout-service`
- crée les enregistrements de payout
- marque les payouts comme payés
- journalise l’action

### 14.4 Style d’API
Le style exact d’API HTTP n’est pas figé ici, mais les principes sont figés :
- endpoints idempotents pour paiements et webhooks
- auth obligatoire sur endpoints métiers
- validation stricte des payloads
- aucune logique monétaire côté client

---

## 15. Event system

### 15.1 Objectif
Découpler les changements d’état métier des effets secondaires.

### 15.2 Table officielle
`domain_events`

### 15.3 Événements métiers minimums
- `client.created`
- `partner.submitted`
- `partner.approved`
- `partner.rejected`
- `partner.suspended`
- `courier.submitted`
- `courier.approved`
- `courier.rejected`
- `courier.suspended`
- `product.created`
- `product.updated`
- `product.deleted`
- `order.created`
- `order.paid`
- `order.in_preparation`
- `order.ready_for_pickup`
- `delivery.assigned`
- `delivery.refused`
- `delivery.picked_up`
- `order.delivered`
- `loyalty.earned`
- `referral.created`
- `referral.rewarded`
- `notification_pack.purchased`
- `campaign.sent`
- `payout.paid`
- `account.suspended`

### 15.4 Consommateurs d’événements
- notifications transactionnelles
- mise à jour dashboards/views
- fidélité
- parrainage
- audit/logging
- monitoring opérationnel

### 15.5 Idempotence
Chaque événement sensible peut porter `idempotency_key` pour éviter :
- double traitement webhook
- double attribution de points
- double crédit notification
- double paiement marqué réussi

---

## 16. Logging strategy

### 16.1 Couches de logs
#### A. Logs métier persistés
- `admin_action_logs`
- `domain_events`

#### B. Logs applicatifs runtime
- logs Next.js / Vercel
- logs Supabase
- logs webhook Stripe

#### C. Logs sécurité
- erreurs auth
- refus RLS significatifs côté monitoring
- blocages rate limiting
- tentatives de mutation non autorisées

### 16.2 Ce qui doit être loggé systématiquement
- validations admin
- suspensions
- transitions order
- transitions delivery
- paiements Stripe
- achats packs notifications
- campagnes IA envoyées
- payouts payés

### 16.3 Rétention et sensibilité
- les logs métier ne doivent jamais exposer de secrets
- les payloads sensibles doivent être minimisés
- les logs admin sont consultables uniquement par admin

---

## 17. Security architecture

### 17.1 Périmètre sécurité officiel
Le projet doit intégrer dès le départ :
- RLS Supabase
- permissions strictes
- rôles sécurisés
- uploads protégés
- validation backend
- secrets jamais exposés frontend
- auth sécurisée
- reset password
- email verification
- anti spam
- rate limiting
- logs admin

### 17.2 Modèle de confiance
#### Frontend
Non fiable pour :
- montants
- statuts critiques
- permissions
- crédits notifications
- validation de documents

#### Backend
Source de vérité pour :
- calcul économique par article
- paiements
- transitions métier sensibles
- contrôle des accès étendus
- génération IA
- administration

#### Base de données
Source de vérité persistante, protégée par :
- FK
- CHECK constraints
- RLS
- indexes
- fonctions helper

### 17.3 Contrôles obligatoires
- validation stricte de tous les payloads backend
- rate limiting sur signup, login, reset password, checkout, campagnes IA, webhooks exposés
- anti-spam sur formulaires exposés publiquement
- rotation et séparation des secrets par environnement
- webhook Stripe signé
- signed URLs pour documents privés
- stockage sécurisé de session côté mobile

### 17.4 Secrets
Secrets interdits côté frontend :
- service role Supabase
- Stripe secret key
- webhook signing secret
- secrets provider IA
- secrets internes d’administration

### 17.5 Soft delete / suspension
- `profiles.account_status = suspended|deleted` pilote les accès globaux
- `account_suspensions` conserve l’historique
- `partners.validation_status` et `couriers.validation_status` pilotent les accès métier spécifiques

---

## 18. Deployment architecture

### 18.1 Composants déployés
- Frontend web Next.js sur Vercel
- services backend Next.js server-side sur Vercel
- base PostgreSQL + Auth + Storage sur Supabase
- webhooks Stripe exposés par l’application backend
- application mobile buildée avec l’outillage Expo

### 18.2 Topologie cible
- `Foodiz.co` : frontend web public et surfaces web sécurisées
- Supabase : base, auth, storage, policies RLS
- Stripe : paiements et webhooks
- Expo Notifications / Firebase : push

### 18.3 Jobs planifiés
Des tâches planifiées sont nécessaires pour :
- contrôle des RC PRO à échéance 7 jours
- désactivation/suspension automatisée si nécessaire
- traitements différés de notifications
- nettoyage technique éventuel de sessions ou tokens invalides

Le mécanisme exact peut être porté par Vercel Cron ou un équivalent compatible avec la stack officielle.

---

## 19. Environment strategy

### 19.1 Environnements cibles
- `local`
- `staging`
- `production`

### 19.2 Séparation stricte
Chaque environnement possède :
- son projet Supabase
- ses clés Supabase
- ses buckets storage
- son projet Stripe / mode correspondant
- ses variables Vercel
- ses builds Expo pointant vers les bons backends

### 19.3 Données et migrations
- migrations SQL versionnées
- seeds minimales pour catégories et règles initiales
- aucune donnée de production copiée en clair vers staging

### 19.4 Variables d’environnement
Familles de variables attendues :
- Supabase public URL / anon key
- Supabase service role key
- Stripe public key / secret key / webhook secret
- provider notifications
- provider IA
- configuration rate limiting
- paramètres d’application par environnement

Le nom exact des variables sera défini en phase d’implémentation.

---

## 20. Scalability strategy

### 20.1 Principes
La scalabilité de Foodiz repose sur :
- séparation claire des domaines
- snapshots économiques à la commande
- lectures optimisées par index et vues
- écriture protégée via services ciblés
- side-effects découplés via événements
- modèle MVP pouvant évoluer plus tard vers plusieurs établissements partner via migration versionnée

### 20.2 Base de données
- index dédiés sur recherche, orders, deliveries, payouts et logs
- vues SQL pour revenus et statistiques
- pagination systématique sur listes admin, orders, products, logs
- éviter les scans complets sur tables à forte croissance

### 20.3 Notifications
- ledger de crédits append-only
- dispatches persistés de manière asynchrone
- envoi push batché par workers/services

### 20.4 Livraison temps réel
- persistance uniquement du dernier point GPS utile en base
- temps réel détaillé géré par stream/realtime plutôt que par stockage exhaustif de chaque ping
- throttling des mises à jour GPS

### 20.5 Frontend
- packages partagés pour éviter duplication
- guards de rôle centralisés
- lecture directe sous RLS pour limiter la charge backend inutile
- services dédiés seulement pour les opérations critiques

### 20.6 Admin
- vues dédiées pour stats et revenus
- requêtes agrégées prévisibles
- journaux séparés des tables transactionnelles critiques

---

## 21. Vérification de conformité au MASTER SPEC

Le blueprint v1.1 reste conforme aux contraintes officielles suivantes :
- uniquement deux types d’établissements : `restaurant` et `market`
- absence totale de `sweet_night`
- absence totale de `market_day`
- absence totale de `market_night`
- modèle économique calculé **par article**
- documents partner stockés en bucket privé
- validation admin obligatoire pour les partners
- validation admin obligatoire pour les couriers

---

## 22. Résumé exécutif CTO

Le blueprint officiel Foodiz v1.1 repose sur :
- une modélisation PostgreSQL claire et normalisée
- une séparation stricte entre CRUD simple et logique sensible
- RLS sur toutes les tables applicatives
- une logique économique figée par snapshots au niveau `order_items`
- une chaîne de commande/livraison implémentée par statuts maîtrisés
- des validations admin explicites pour partner et courier
- un ledger propre pour fidélité, parrainage et crédits notifications
- un scoring IA structuré pour les campagnes partner
- une architecture backend sécurisée pour Stripe, validations, payouts et IA
- une répartition frontend cohérente : mobile pour client/courier, web pour site/partner/admin
- une structure MVP en `1 partner = 1 établissement`, mais pensée pour rester évolutive

Ce document constitue la base technique officielle avant :
- schéma SQL détaillé
- migrations
- policies RLS implémentées
- structure monorepo
- développement applicatif

Aucun code applicatif ne doit être démarré avant validation complète de ce blueprint.
