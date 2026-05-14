# FOODIZ DATABASE IMPLEMENTATION SPEC

Version: 1.0  
Statut: Phase 3 — migrations Supabase SQL prêtes à validation  
Dépendances: `FOODIZ_MASTER_SPEC.md`, `FOODIZ_TECHNICAL_BLUEPRINT_v1.1.md`

## Objectif
Préparer la base PostgreSQL / Supabase de Foodiz sans frontend, sans UI et sans modification métier.

## Clarifications intégrées dans cette phase

### 1. Gain livreur final
Le gain livreur final est implémenté comme :

`courier_total_earning_cents = orders.courier_share_cents + orders.delivery_fee_cents`

Règle conservée :
- `orders.courier_share_cents` = part cumulée **par article uniquement**
- les vues SQL exposent explicitement cette formule

### 2. Base de payout partner
Le payout partner est basé sur :

`orders.subtotal_partner_cents`

Règle conservée :
- le partner récupère son **prix partner**
- Foodiz conserve :
  - `total_markup_cents`
  - `service_fee_cents`
  - les revenus des packs notifications

### 3. Clarification SIRET
- `partners.siret` = numéro SIRET saisi
- `partner_documents.document_type = 'siret'` = justificatif / preuve associé si requis
- les deux notions sont volontairement séparées dans le schéma SQL

## Découpage des migrations

1. `supabase/migrations/0001_extensions_and_enums.sql`
   - extensions PostgreSQL
   - enums officiels

2. `supabase/migrations/0002_core_identity_and_catalog_foundation.sql`
   - profils
   - adresses client
   - partners
   - documents partner
   - couriers
   - disponibilités
   - catégories

3. `supabase/migrations/0003_commerce_orders_and_delivery.sql`
   - produits
   - paniers
   - zones de livraison
   - commandes
   - paiements
   - livraisons

4. `supabase/migrations/0004_engagement_notifications_finance_and_logging.sql`
   - fidélité
   - parrainage
   - avis
   - notifications
   - payouts
   - suspensions
   - logs
   - domain events

5. `supabase/migrations/0005_functions_triggers_and_integrity_guards.sql`
   - fonctions helper RLS
   - triggers `updated_at`
   - garde-fous SQL
   - validations de transitions
   - validations d’intégrité métier

6. `supabase/migrations/0006_indexes_and_views.sql`
   - indexes
   - vues de revenus
   - vues de stats
   - vue de lecture commande

7. `supabase/migrations/0007_row_level_security.sql`
   - activation RLS
   - policies Supabase sur les tables applicatives

8. `supabase/migrations/0008_storage_partner_documents.sql`
   - bucket privé `partner-documents-private`
   - policies Supabase Storage
   - respect de la règle : documents partner privés

## Conformité MASTER SPEC confirmée
- uniquement `restaurant` et `market`
- pas de `sweet_night`
- pas de `market_day`
- pas de `market_night`
- logique économique par article
- documents partner privés
- validation admin obligatoire pour partner et courier

## Statut
Les migrations sont prêtes pour relecture et validation avant exécution Supabase.
