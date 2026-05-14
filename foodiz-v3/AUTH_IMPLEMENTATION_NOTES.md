# Foodiz v3 — Notes d'implémentation des flows d'authentification

Cette note résume ce qui a été ajouté lors de l'itération « Finir les flows
auth ». Elle décrit les choix d'implémentation, les contraintes qu'ils
respectent (RLS, blueprint), et la marche à suivre côté Supabase pour les
faire fonctionner.

## TL;DR — ce qui marche maintenant

| Flow | État |
|---|---|
| Connexion email/mot de passe (tous rôles) | ✅ implémenté |
| Inscription **client** depuis `/auth` | ✅ implémenté |
| Inscription **partner** depuis `/auth/partner` | ✅ implémenté |
| Inscription **courier** depuis `/auth/courier` | ✅ implémenté |
| Mot de passe oublié — demande de lien | ✅ implémenté |
| Mot de passe oublié — saisie nouveau MDP via `/auth/reset-password` | ✅ implémenté |
| Onboarding partner (établissement + 3 docs) `/partner/onboarding` | ✅ implémenté |
| Onboarding courier (acknowledgement) `/courier/onboarding` | ✅ implémenté |
| Gating « validation_status pending » sur `/partner` et `/courier` | ✅ implémenté |
| Création automatique du `profiles` post-signup côté Supabase | ✅ via migration `0009` |
| Création automatique du `loyalty_accounts` pour les clients | ✅ via migration `0009` |

## Migration SQL ajoutée

**`supabase/migrations/0009_handle_new_user_signup_trigger.sql`**

Le blueprint v1.1 §6 indique :

> `profiles INSERT` : via trigger backend post-signup uniquement

…mais aucun trigger n'existait. La migration `0007` (RLS) confirme l'absence
de policy `profiles_insert`, ce qui rendait impossible la création d'un profil
depuis le navigateur. Le code front existant tentait pourtant un `insert`
direct → il aurait été rejeté en production.

La nouvelle migration ajoute :

- `public.generate_referral_code(uuid)` — génère un code lisible `fdz-xxxxxxxx-xxxx`.
- `public.handle_new_user()` (`SECURITY DEFINER`) — lit
  `auth.users.raw_user_meta_data` (`requested_role`, `first_name`, `last_name`,
  `phone`, `referred_by_code`), insère la ligne `profiles` correspondante avec
  le bon rôle, et bootstrappe `loyalty_accounts` pour les clients.
- Trigger `on_auth_user_created after insert on auth.users`.

Le trigger fonctionne en signup parce que le guard `guard_profiles_protected_columns`
court-circuite quand `auth.uid() is null` (contexte de création de compte).

> ⚠️ **À appliquer sur le projet Supabase** avant de tester (`supabase db push`
> ou exécution manuelle dans le SQL editor).

## Front-end — fichiers ajoutés / modifiés

### Modifiés

- `src/components/auth/AuthProvider.jsx`
  - Suppression de l'`insert profiles` côté client (le trigger s'en charge).
  - Lecture de profil avec retry court (race avec le trigger juste après signup).
  - Nouveau flag `recoveryMode` activé sur l'évènement `PASSWORD_RECOVERY`.
  - Nouveau `signUp({ role, … })` générique + helpers `signUpClient`,
    `signUpPartner`, `signUpCourier`.
  - Nouveau `updatePassword(newPassword)`.
  - `resetPassword(email)` redirige désormais vers `/auth/reset-password`.

- `src/pages/auth/AuthHomePage.jsx`
  - Boutons « S'inscrire » des cartes pro câblés vers `/auth/partner` et `/auth/courier`.
  - Détection `recoveryMode` → redirection vers `/auth/reset-password`.

- `src/pages/partner/PartnerHomePage.jsx`
  - Trois états :
    - pas de ligne `partners` → CTA vers `/partner/onboarding`
    - `validation_status` ∈ {pending, rejected, suspended} → écran d'attente
    - `approved` → placeholder dashboard.

- `src/pages/courier/CourierHomePage.jsx` — même logique pour les couriers.

- `src/routes/index.jsx` — nouvelles routes `/auth/partner`,
  `/auth/courier`, `/auth/reset-password`, `/partner/onboarding`,
  `/courier/onboarding`.

- `src/routes/ProtectedRoute.jsx` — redirige toute route protégée vers
  `/auth/reset-password` quand `recoveryMode` est actif.

### Ajoutés

- `src/pages/auth/ProSignupPage.jsx` — formulaire d'inscription unique pour
  partner et courier (le rôle est dérivé de l'URL `:role`).
- `src/pages/auth/ResetPasswordPage.jsx` — saisie du nouveau mot de passe
  après clic sur le lien de récupération.
- `src/pages/partner/PartnerOnboardingPage.jsx` — création de la ligne
  `partners` (`validation_status = pending`, `rc_pro_due_at = now() + 7j`),
  upload des 3 documents obligatoires (SIRET, pièce d'identité, KBIS) dans
  le bucket privé `partner-documents-private` au format de chemin imposé
  par `storage_partner_document_path_is_valid()`, puis création des lignes
  `partner_documents` correspondantes.
- `src/pages/courier/CourierOnboardingPage.jsx` — acknowledgement +
  insertion `couriers` (`validation_status = pending`).

## Configuration Supabase à vérifier

1. **Appliquer la migration `0009`** (sinon aucun signup ne fonctionnera —
   le trigger profil n'existera pas).
2. **URL Configuration → Redirect URLs** : ajouter
   - `http://localhost:5173/auth`
   - `http://localhost:5173/auth/reset-password`
   - (et les équivalents en production).
3. **Email templates** : le template « Reset Password » doit pointer vers
   `{{ .SiteURL }}/auth/reset-password` — c'est ce que `resetPasswordForEmail`
   passe en `redirectTo`, mais certains templates personnalisés ignorent ce
   paramètre.
4. **Email confirmation** : si « Confirm email » est ON, l'utilisateur doit
   cliquer le lien de confirmation **avant** de pouvoir se connecter et
   accéder à son onboarding. Le code gère les deux cas (`session` présente
   ou non dans la réponse `signUp`).

## Limites connues / pistes pour la suite

- **Géocodage** : le formulaire partner exige lat/lng manuels. À remplacer
  par un autocomplete (ex. Google Places ou Mapbox) une fois les clés
  fournies.
- **RC PRO** : le compte à rebours de 7 jours est posé (`rc_pro_due_at`)
  mais il manque le job de suspension automatique côté backend (à traiter
  dans une edge function planifiée).
- **Documents** : pas encore de re-upload depuis le dashboard partner pour
  les documents rejetés (RLS le permet, l'UI viendra avec le dashboard
  partner complet).
- **Admin validation** : aucune UI admin pour approuver/rejeter dossiers
  partner/courier — c'est le prochain gros chantier (`AdminHomePage` est
  toujours un placeholder).
- **Account suspendu** : `account_status = suspended` n'est pas encore
  traité dans `RoleGuard` (à ajouter — actuellement seul `role` est vérifié).
