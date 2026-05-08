# FOODIZ MASTER SPEC

Version: 1.0  
Statut: Source officielle de cadrage produit et technique  
Rôle de ce document: Document maître de référence avant toute phase de développement  
Règle: Aucune fonctionnalité, règle métier ou hypothèse ne doit être ajoutée en dehors de ce document sans validation explicite.

---

## 1. Vision produit

Foodiz est une marketplace premium locale de livraison.

Foodiz permet aux utilisateurs de :
- commander des repas
- commander dans des épiceries / commerces de proximité
- se faire livrer rapidement
- gagner des avantages fidélité
- soutenir les commerces locaux

Foodiz comprend :
1. une application mobile iOS + Android
2. un site web
3. un panel admin complet
4. une interface partenaires
5. une interface livreurs

Objectif produit global : construire une plateforme premium, fiable et scalable de commande et livraison locale, avec un système de rôles robuste, une architecture professionnelle, une base de données propre, une authentification sécurisée et une logique économique exacte.

Contraintes globales :
- maintenable
- scalable
- sécurisé
- performant
- App Store ready
- Google Play ready
- responsive
- production ready

---

## 2. Positionnement

Foodiz est positionné comme une marketplace locale de livraison à image premium.

Axes de positionnement :
- premium
- local
- chaleureux
- gourmand
- élégant
- moderne
- fluide
- jamais cheap
- jamais agressif

Promesse implicite du service :
- proposer une expérience haut de gamme de livraison locale
- valoriser les commerces de proximité
- offrir une expérience de commande fluide et fiable
- associer usage pratique, fidélité et soutien au commerce local

---

## 3. Branding

### 3.1 Identité nominale
Nom officiel : **Foodiz**

Règle obligatoire :
- le logo doit toujours être écrit : **Foodiz**
- et jamais : **FOODIZ**

### 3.2 Univers de marque
Foodiz possède un univers :
- premium
- artisanal
- chaleureux
- gourmand
- local
- élégant
- moderne

L’application et les interfaces doivent évoquer :
- un packaging premium alimentaire
- une ambiance chaleureuse
- des matières naturelles
- une expérience haut de gamme

### 3.3 Palette principale
Palette officielle :
- noir profond
- doré chaud
- kraft
- crème
- beige chaud
- blanc cassé

### 3.4 Style UI
Le style d’interface doit respecter :
- noir profond dominant
- cartes sombres premium
- détails dorés élégants
- header papier kraft plié réaliste
- boutons premium
- ombres douces
- images gourmandes
- ambiance luxe alimentaire

### 3.5 Typographie
Le logo utilise une typographie :
- serif premium
- style Canela
- légèrement italique
- élégante

---

## 4. Rôles utilisateurs

Foodiz possède 4 rôles :
1. client
2. partner
3. courier
4. admin

### 4.1 Client
Le client peut :
- créer un compte
- se connecter
- ajouter plusieurs adresses
- rechercher des restaurants
- rechercher dans Market
- voir les catégories
- ajouter au panier
- payer
- suivre sa commande
- voir ses commandes passées
- gagner des points fidélité
- parrainer
- noter restaurant et livreur

### 4.2 Partner
Le partner représente :
- restaurant
- ou market

Le partner peut :
- créer un compte professionnel
- gérer ses produits
- gérer ses commandes
- voir ses statistiques
- voir ses revenus
- utiliser les campagnes notifications IA
- gérer son établissement

Validation partner obligatoire :
- validation manuelle par un admin
- délai annoncé : 24 à 48h

Documents obligatoires à l’inscription :
- SIRET
- pièce identité
- KBIS

RC PRO :
- obligatoire sous 7 jours
- sinon suspension/suppression compte

### 4.3 Courier
Le livreur peut :
- créer un compte
- définir ses disponibilités
- voir livraisons
- accepter/refuser commandes
- suivre GPS
- confirmer récupération
- confirmer livraison
- voir revenus
- voir statistiques

Validation courier obligatoire :
- validation admin obligatoire

### 4.4 Admin
L’admin possède le contrôle total de la plateforme.

L’admin peut :
- gérer utilisateurs
- gérer partenaires
- gérer livreurs
- gérer commandes
- voir revenus
- gérer fidélité
- gérer notifications
- gérer payouts
- suspendre comptes
- valider comptes
- voir statistiques globales

---

## 5. Parcours utilisateurs

Les parcours ci-dessous reprennent uniquement les actions explicitement définies dans la source officielle.

### 5.1 Parcours client
1. création de compte
2. connexion
3. ajout d’une ou plusieurs adresses
4. recherche de restaurants ou recherche dans Market
5. consultation des catégories
6. ajout d’articles au panier
7. paiement
8. suivi de commande
9. consultation des commandes passées
10. gain de points fidélité
11. parrainage
12. notation restaurant et livreur

### 5.2 Parcours partner
1. création de compte professionnel
2. soumission des pièces obligatoires : SIRET, pièce identité, KBIS
3. validation manuelle admin sous 24 à 48h
4. obligation RC PRO sous 7 jours
5. gestion de l’établissement
6. gestion des produits
7. gestion des commandes
8. consultation des statistiques
9. consultation des revenus
10. utilisation des campagnes notifications IA

### 5.3 Parcours courier
1. création de compte
2. validation admin obligatoire
3. définition des disponibilités
4. consultation des livraisons
5. acceptation ou refus des commandes
6. suivi GPS
7. confirmation de récupération
8. confirmation de livraison
9. consultation des revenus
10. consultation des statistiques

### 5.4 Parcours admin
1. connexion admin
2. validation / suspension de comptes
3. gestion utilisateurs
4. gestion partenaires
5. gestion livreurs
6. gestion commandes
7. gestion fidélité
8. gestion notifications
9. gestion payouts
10. consultation revenus
11. consultation statistiques globales

---

## 6. Liste complète des pages

La liste ci-dessous est dérivée strictement des rôles, actions et composants explicitement mentionnés dans la source officielle.

### 6.1 Application mobile / web public - zone client
- Accueil
- Création de compte
- Connexion
- Réinitialisation mot de passe
- Vérification email
- Gestion des adresses
- Recherche Restaurants
- Recherche Market
- Catégories
- Fiche établissement
- Fiche article / produit
- Panier
- Paiement
- Suivi de commande
- Historique des commandes
- Fidélité
- Parrainage
- Notation restaurant
- Notation livreur
- Compte / Profil

### 6.2 Interface partner
- Création de compte professionnel
- Connexion
- Réinitialisation mot de passe
- Vérification email
- Dépôt des documents obligatoires
- Statut de validation du compte
- Gestion établissement
- Gestion produits
- Gestion commandes
- Revenus
- Statistiques
- Campagnes notifications IA
- Achat packs notifications

### 6.3 Interface courier
- Création de compte
- Connexion
- Réinitialisation mot de passe
- Vérification email
- Statut de validation du compte
- Disponibilités
- Liste des livraisons
- Détail livraison
- GPS / suivi
- Confirmation récupération
- Confirmation livraison
- Revenus
- Statistiques

### 6.4 Panel admin
- Connexion admin
- Dashboard global
- Gestion utilisateurs
- Gestion partenaires
- Détail partner
- Validation partner
- Suivi documents partner
- Gestion livreurs
- Détail courier
- Validation courier
- Gestion commandes
- Gestion fidélité
- Gestion notifications
- Gestion payouts
- Gestion revenus
- Statistiques globales
- Suspension comptes
- Logs admin
- Paramétrage frais de livraison par zones

### 6.5 Site web Foodiz.co
Le site web fait partie du périmètre officiel. Les pages explicitement imposées par la source sont :
- site web Foodiz.co
- accès aux espaces applicatifs nécessaires au fonctionnement

Pages minimales strictement déductibles du périmètre produit :
- Accueil
- Accès client
- Accès partner
- Accès courier
- Accès admin

Note : toute page marketing, légale, SEO ou éditoriale supplémentaire devra être validée explicitement lors d’une version ultérieure du master spec si elle n’est pas déjà couverte par les exigences stores, sécurité ou conformité.

---

## 7. Fonctionnalités MVP

Le MVP doit couvrir les capacités obligatoires pour rendre Foodiz exploitable selon la source officielle.

### 7.1 MVP Client
- création de compte
- connexion
- email verification
- reset password
- gestion de plusieurs adresses
- recherche restaurants
- recherche Market
- consultation catégories
- ajout au panier
- paiement via Stripe
- suivi de commande
- historique des commandes
- fidélité
- parrainage
- notation restaurant et livreur

### 7.2 MVP Partner
- création de compte professionnel
- soumission SIRET
- soumission pièce identité
- soumission KBIS
- suivi validation admin
- gestion établissement
- gestion produits
- gestion commandes
- consultation statistiques
- consultation revenus
- achat et utilisation packs notifications IA
- règle RC PRO sous 7 jours avec suspension/suppression si non conforme

### 7.3 MVP Courier
- création de compte
- validation admin
- gestion disponibilités
- consultation livraisons
- acceptation/refus commandes
- suivi GPS
- confirmation récupération
- confirmation livraison
- consultation revenus
- consultation statistiques

### 7.4 MVP Admin
- contrôle total de la plateforme
- gestion utilisateurs
- gestion partenaires
- validation partner
- suivi conformité documents partner
- gestion livreurs
- validation courier
- gestion commandes
- gestion fidélité
- gestion notifications
- gestion payouts
- gestion revenus
- statistiques globales
- suspension comptes
- paramétrage frais de livraison par zones
- logs admin

### 7.5 MVP Système
- backend sécurisé
- base de données PostgreSQL via Supabase
- Supabase Auth
- Supabase Storage
- Stripe
- Expo Notifications / Firebase
- Vercel
- RLS Supabase
- permissions strictes
- rôles sécurisés
- uploads protégés
- validation backend
- anti spam
- rate limiting

---

## 8. Fonctionnalités futures

Aucune fonctionnalité future supplémentaire n’est officiellement définie dans la source fournie.

Règle produit :
- ne rien ajouter dans cette section sans validation explicite
- toute extension future devra faire l’objet d’une nouvelle version du master spec

---

## 9. Architecture frontend

### 9.1 Stack officielle
Frontend Mobile :
- React Native
- Expo

Frontend Web :
- Next.js

### 9.2 Architecture fonctionnelle frontend
Le frontend est structuré en 5 surfaces produit :
1. application mobile iOS + Android
2. site web Foodiz.co
3. interface partners
4. interface couriers
5. panel admin

### 9.3 Principes d’architecture frontend
Principes obligatoires :
- architecture maintenable
- scalable
- responsive
- production ready
- cohérence visuelle avec le branding Foodiz
- séparation claire des surfaces par rôle
- authentification sécurisée
- gestion stricte des permissions par rôle

### 9.4 Principes UI
Toutes les surfaces doivent respecter :
- univers premium, chaleureux, gourmand, élégant
- noir profond dominant
- détails dorés élégants
- cartes sombres premium
- header papier kraft plié réaliste
- boutons premium
- ombres douces
- images gourmandes

---

## 10. Architecture backend

### 10.1 Stack officielle backend
Backend / Database :
- Supabase
- PostgreSQL

Auth :
- Supabase Auth

Storage :
- Supabase Storage

Paiement :
- Stripe

Notifications :
- Expo Notifications / Firebase

Hosting :
- Vercel

### 10.2 Domaines fonctionnels backend
Le backend doit couvrir les domaines suivants :
- authentification
- gestion des rôles
- gestion des profils
- gestion des établissements
- gestion des produits
- panier et commande
- paiement
- suivi commande
- livraison
- fidélité
- parrainage
- notifications IA partners
- revenus
- payouts
- validation partenaires
- validation livreurs
- administration globale
- logs admin
- configuration des frais de livraison par zones

### 10.3 Principes backend
- validation backend obligatoire
- secrets jamais exposés côté frontend
- logique métier centralisée et sécurisée
- contrôle strict des droits selon le rôle
- traitement fiable des commandes
- intégration sécurisée Stripe
- intégration notifications sécurisée

---

## 11. Architecture base de données

### 11.1 Base officielle
Base de données officielle : PostgreSQL via Supabase

### 11.2 Principes de modélisation
La base doit être :
- propre
- scalable
- sécurisée
- maintenable
- compatible production réelle

### 11.3 Entités métier minimales déductibles
Les domaines de données requis par la source impliquent au minimum les ensembles d’entités suivants :

#### Authentification et rôles
- utilisateurs
- rôles
- profils

#### Client
- adresses client
- commandes client
- historique commandes
- fidélité
- parrainage
- avis restaurant
- avis livreur

#### Partner
- comptes partners
- établissements partners
- type établissement : restaurant ou market
- produits
- commandes partner
- revenus partner
- statistiques partner
- documents partner
- statut validation partner
- RC PRO et suivi délai 7 jours
- packs notifications
- campagnes notifications IA

#### Courier
- comptes couriers
- disponibilités courier
- livraisons
- statuts livraison
- revenus courier
- statistiques courier
- statut validation courier

#### Commerce et commande
- catégories
- panier
- lignes panier
- commandes
- lignes commandes
- paiements
- frais de service
- frais de livraison
- zones de livraison

#### Administration
- comptes admin
- validations
- suspensions
- payouts
- statistiques globales
- notifications
- logs admin

### 11.4 Contraintes métier structurelles
- un établissement partner est exclusivement de type restaurant ou market
- sweet_night, market_day et market_night n’existent pas
- les règles économiques sont calculées par article
- les frais de service dépendent du nombre d’articles
- les frais de livraison sont configurables côté admin et dépendent des zones, avec possibilité d’évolution selon distance
- les documents obligatoires partner doivent être suivis en base
- les statuts de validation partner et courier doivent être suivis en base
- l’historique des commandes doit être conservé
- les revenus partner et courier doivent être accessibles
- les mécanismes fidélité et parrainage doivent être traçables

### 11.5 Note de gouvernance
Le schéma détaillé table par table, colonnes, contraintes, index, politiques RLS et relations exactes devra être produit après validation de ce master spec, sans sortir du cadre métier défini ici.

---

## 12. Sécurité

La sécurité est obligatoire dès le départ.

Exigences officielles :
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

### 12.1 Principes de sécurité
- aucun secret applicatif exposé côté client
- séparation stricte des droits entre client, partner, courier et admin
- accès aux données limité par rôle
- stockage protégé des documents et uploads
- traçabilité des actions sensibles admin
- sécurisation des flux d’authentification
- protection contre les abus et automatisations non désirées

### 12.2 Surfaces sensibles à protéger
- documents partner
- validations admin
- données de commande
- données de paiement
- revenus et payouts
- campagnes notifications
- données de profil et adresses

---

## 13. Logique économique

### 13.1 Principe fondamental
Le modèle Foodiz fonctionne **par article**.

Les tranches ne s’appliquent pas :
- au panier global
- au total commande
- au restaurant

Les tranches s’appliquent individuellement à chaque article selon son prix partner.

### 13.2 Principe exact
- le partner fixe le prix réel de son article
- Foodiz ajoute automatiquement un supplément invisible selon la tranche du prix partner
- le client voit uniquement le prix final

### 13.3 Exemple officiel
- prix partner : Burger = 7€
- 7€ entre dans la tranche : 3.51€ → 8.49€
- supplément Foodiz : +2.50€
- prix client affiché : 9.50€

### 13.4 Tranche 1
Prix partner : 0.50€ → 3.50€  
Supplément : +1€

Répartition :
- livreur : 0.50€
- Foodiz : 0.50€

### 13.5 Tranche 2
Prix partner : 3.51€ → 8.49€  
Supplément : +2.50€

Répartition :
- livreur : 1€
- Foodiz : 1€
- fidélité : 0.20€
- parrainage : 0.30€

### 13.6 Tranche 3
Prix partner : 8.50€ et +  
Supplément : +3€

Répartition :
- livreur : 1€
- Foodiz : 1.50€
- fidélité : 0.20€
- parrainage : 0.30€

### 13.7 Frais de service Foodiz
- 1 article : 1.99€
- 2 articles : 1.49€
- 3 articles : 1.19€
- 4 articles et + : 0.99€

### 13.8 Frais de livraison
Les frais de livraison :
- sont configurables
- dépendent des zones
- peuvent évoluer selon distance
- sont gérés côté admin

---

## 14. Logique commandes

La logique commandes doit respecter uniquement les éléments explicitement définis.

### 14.1 Capacités côté client
- rechercher des restaurants
- rechercher dans Market
- voir catégories
- ajouter au panier
- payer
- suivre sa commande
- voir ses commandes passées
- noter restaurant et livreur

### 14.2 Capacités côté partner
- gérer ses produits
- gérer ses commandes
- voir ses statistiques
- voir ses revenus
- gérer son établissement

### 14.3 Capacités côté courier
- définir ses disponibilités
- voir livraisons
- accepter/refuser commandes
- suivre GPS
- confirmer récupération
- confirmer livraison
- voir revenus
- voir statistiques

### 14.4 Capacités côté admin
- gérer commandes
- gérer payouts
- voir revenus
- voir statistiques globales
- configurer les frais de livraison par zones

### 14.5 Principes commandes
- le calcul économique se fait article par article
- les montants des articles se cumulent dans la commande finale
- des frais de service Foodiz s’ajoutent selon le nombre d’articles
- des frais de livraison s’ajoutent selon zones et potentiellement distance
- le paiement est réalisé via Stripe
- le suivi de commande doit être disponible pour le client
- la chaîne de livraison comprend au minimum : acceptation/refus par courier, confirmation de récupération et confirmation de livraison

---

## 15. Logique fidélité

Le client gagne des points via :
- commandes
- avis restaurant
- avis livreur
- questionnaires satisfaction

Contraintes :
- la fidélité fait partie du périmètre officiel
- une partie des tranches finance la fidélité pour les tranches 2 et 3
- la logique détaillée de conversion des points n’est pas définie dans la source actuelle et ne doit pas être inventée à ce stade

---

## 16. Logique notifications

### 16.1 Notifications IA partner
Les partners peuvent acheter des packs notifications.

Objectif :
- envoyer des campagnes gourmandes et chaleureuses aux utilisateurs

Les campagnes sont générées avec une IA.

Ton obligatoire :
- gourmand
- élégant
- chaleureux
- jamais cheap
- jamais agressif

### 16.2 Packs notifications
- Pack Découverte : 15 campagnes — 9.99€
- Pack Boost : 50 campagnes — 24.99€
- Pack Performance : 150 campagnes — 59.99€

### 16.3 Contraintes
- les notifications sont administrables dans la plateforme
- les campaigns doivent respecter strictement le ton de marque Foodiz
- aucune autre offre pack ou logique tarifaire ne doit être ajoutée sans validation

---

## 17. Logique admin

L’admin a le contrôle total de la plateforme.

Capacités officielles :
- gérer utilisateurs
- gérer partenaires
- gérer livreurs
- gérer commandes
- voir revenus
- gérer fidélité
- gérer notifications
- gérer payouts
- suspendre comptes
- valider comptes
- voir statistiques globales

Responsabilités critiques déduites directement des règles officielles :
- validation manuelle partners sous 24 à 48h
- validation obligatoire couriers
- suivi des documents partners
- contrôle RC PRO sous 7 jours
- suspension/suppression compte partner si non conforme RC PRO
- gestion des frais de livraison par zones
- supervision globale économique et opérationnelle
- journalisation des actions admin

---

## 18. Roadmap développement

Aucun code ne doit être produit avant validation complète du présent document.

### Phase 0 — Validation du master spec
- valider le cadre produit officiel
- valider les règles métier officielles
- valider le positionnement et le branding
- valider le périmètre MVP

### Phase 1 — Architecture détaillée
- détailler l’architecture frontend par surface
- détailler l’architecture backend par domaine
- produire le schéma détaillé de base de données
- définir les politiques RLS
- définir les flux Stripe
- définir les flux notifications
- définir les flux de validation partner et courier

### Phase 2 — Design system
- formaliser les tokens visuels
- formaliser composants premium Foodiz
- décliner mobile, web, partner, courier, admin
- verrouiller la cohérence branding

### Phase 3 — Développement fondations
- auth sécurisée
- rôles et permissions
- structure base de données
- stockage sécurisé
- socle admin
- intégrations Stripe et notifications

### Phase 4 — Développement produits
- app client
- interface partner
- interface courier
- panel admin
- site web Foodiz.co

### Phase 5 — Stabilisation
- tests fonctionnels
- tests sécurité
- tests permissions
- tests économiques
- tests commande / livraison / payouts
- optimisation performance

### Phase 6 — Release
- préparation App Store
- préparation Google Play
- mise en production web
- mise en production backend
- monitoring initial

---

## 19. Contraintes App Store / Google Play

Le projet doit être :
- App Store ready
- Google Play ready

Exigences officiellement mentionnées ou directement liées aux contraintes de sécurité du projet :
- authentification sécurisée
- reset password
- email verification
- gestion sécurisée des comptes
- application responsive et production ready

Règle :
- toute exigence additionnelle de conformité store non mentionnée ici pourra être traitée en phase de préparation release, sans modifier les règles métier du produit

---

## 20. Structure technique globale

### 20.1 Stack officielle consolidée
- Mobile : React Native + Expo
- Web : Next.js
- Backend / Database : Supabase + PostgreSQL
- Auth : Supabase Auth
- Storage : Supabase Storage
- Paiement : Stripe
- Notifications : Expo Notifications / Firebase
- Hosting : Vercel

### 20.2 Surfaces produit
1. application mobile iOS + Android
2. site web Foodiz.co
3. panel admin complet
4. interface partners
5. interface couriers

### 20.3 Piliers techniques obligatoires
- architecture professionnelle
- backend sécurisé
- base de données propre et scalable
- authentification sécurisée
- système de commandes fiable
- logique économique Foodiz exacte
- système de rôles robuste
- sécurité dès le départ

### 20.4 Gouvernance technique
- aucune implémentation avant validation de ce document
- aucune fonctionnalité non présente dans la source officielle
- aucune modification des règles métier sans versioning explicite du master spec
- toute décision de conception détaillée doit rester strictement alignée sur ce document

---

## 21. Récapitulatif exécutif CTO

Foodiz est une marketplace premium locale de livraison, structurée autour de 4 rôles : client, partner, courier et admin.

Le produit couvre :
- commande de repas
- commande Market
- livraison rapide
- fidélité
- parrainage
- gestion partners
- gestion couriers
- administration complète
- logique économique par article
- notifications IA payantes pour partners

La stack officielle est figée :
- React Native / Expo
- Next.js
- Supabase / PostgreSQL
- Supabase Auth
- Supabase Storage
- Stripe
- Expo Notifications / Firebase
- Vercel

Les règles critiques non négociables :
- modèle économique par article
- seulement 2 types d’établissements : restaurant et market
- validation manuelle partner par admin
- validation courier par admin
- RC PRO obligatoire sous 7 jours pour partner
- sécurité forte dès le départ
- aucun code avant validation complète du master spec

Ce document constitue la base officielle de cadrage produit et technique du projet Foodiz.
