import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import { AuthField } from '../../components/auth/AuthField';
import { PasswordField } from '../../components/auth/PasswordField';
import {
  ChefHatIcon,
  MailIcon,
  PhoneIcon,
  ScooterIcon,
  StoreIcon,
  UserIcon,
} from '../../components/auth/AuthIcons';
import authBackgroundMain from '../../assets/auth-background-main.png';

/**
 * Shared signup screen for the two professional roles (partner / courier).
 * Mounted under /auth/partner and /auth/courier.
 *
 * The role is resolved in priority order:
 *   1. `role` prop passed directly from the router (recommended — avoids the
 *      useParams pitfall when the route path is a static segment, not :role)
 *   2. `useParams().role` for backwards-compat if ever mounted under /:role
 *
 * The page only collects auth-level info (identity + credentials). The
 * role-specific business data (establishment for partner, validation for
 * courier) is collected on /partner/onboarding or /courier/onboarding once
 * the user is signed in.
 */

const ROLE_CONFIG = {
  partner: {
    label: 'Restaurant ou épicerie',
    icon: <StoreIcon />,
    title: 'Inscription Restaurants & Épiciers',
    subtitle:
      "Créez votre accès professionnel. Vous compléterez les informations de votre établissement et déposerez vos documents juste après.",
    cta: 'Créer mon compte professionnel',
    signupAction: 'signUpPartner',
    homeRoute: '/partner',
    needsPhone: true,
  },
  courier: {
    label: 'Livreur indépendant',
    icon: <ScooterIcon />,
    title: 'Inscription Livreurs',
    subtitle:
      "Rejoignez la flotte Foodiz. Votre compte sera activé après validation manuelle par un administrateur.",
    cta: 'Créer mon compte livreur',
    signupAction: 'signUpCourier',
    homeRoute: '/courier',
    needsPhone: true,
  },
};

function mapSupabaseError(error) {
  if (!error?.message) return 'Une erreur inattendue est survenue.';
  const m = error.message.toLowerCase();
  if (m.includes('user already registered')) return 'Un compte existe déjà avec cet email.';
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('password should be at least'))
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (m.includes('email rate limit exceeded'))
    return 'Trop de tentatives. Merci de réessayer dans quelques instants.';
  return error.message;
}

const initialForm = { firstName: '', lastName: '', email: '', phone: '', password: '' };

/**
 * @param {{ role?: 'partner' | 'courier' }} props
 *   `role` can be injected directly by the router element (e.g.
 *   `<ProSignupPage role="partner" />`). When absent, falls back to
 *   `useParams().role` for dynamic-segment compatibility.
 */
export function ProSignupPage({ role: roleProp }) {
  // roleProp takes priority; useParams() is the fallback for dynamic routes.
  const { role: roleParam } = useParams();
  const role = roleProp ?? roleParam;

  const navigate = useNavigate();
  const auth = useAuth();
  const config = ROLE_CONFIG[role];

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Once a profile exists with the right role, jump to onboarding (or to
  // the role's home which itself decides whether onboarding is still due).
  useEffect(() => {
    if (!config) return;
    if (auth.session && auth.profile?.role === role) {
      navigate(config.homeRoute, { replace: true });
    }
  }, [auth.session, auth.profile, role, config, navigate]);

  const isSupabaseConfigured = auth.isSupabaseConfigured;

  const subtitleNode = useMemo(
    () => (config ? <p className="auth-subtitle">{config.subtitle}</p> : null),
    [config]
  );

  if (!config) {
    return (
      <div className="auth-unknown-role">
        <h2>Rôle inconnu</h2>
        <p>Cette page est réservée aux inscriptions partenaire ou livreur.</p>
        <Link to="/auth">Retour à l'accueil</Link>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const action = auth[config.signupAction];
    const result = await action({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });

    if (result?.error) {
      setError(mapSupabaseError(result.error));
      setSubmitting(false);
      return;
    }

    if (!result?.data?.session) {
      // Email confirmation flow: the profile + role row will be created by
      // the trigger only after the user clicks the confirmation link.
      setMessage(
        'Compte créé. Confirmez votre email pour accéder à la suite de l\u2019inscription Foodiz.'
      );
    } else {
      setMessage('Compte créé. Redirection en cours\u2026');
    }
    setSubmitting(false);
  }

  return (
    <div className="auth-pro-signup" style={{ backgroundImage: `url(${authBackgroundMain})` }}>
      <div className="auth-pro-signup__card">
        <div className="auth-pro-signup__role-badge">
          {config.icon}
          <span>{config.label}</span>
        </div>

        <h1 className="auth-title">{config.title}</h1>
        {subtitleNode}

        {!isSupabaseConfigured ? (
          <div className="auth-warning">
            <strong>Configuration locale incomplète.</strong> {auth.supabaseConfigError}
          </div>
        ) : null}

        {error ? <p className="auth-error">{error}</p> : null}
        {message ? (
          <p className="auth-success">{message}</p>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-row">
            <AuthField
              icon={<UserIcon />}
              label="Prénom"
              type="text"
              name="firstName"
              placeholder="Lina"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => setForm((c) => ({ ...c, firstName: e.target.value }))}
              required
            />
            <AuthField
              icon={<UserIcon />}
              label="Nom"
              type="text"
              name="lastName"
              placeholder="Martin"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => setForm((c) => ({ ...c, lastName: e.target.value }))}
              required
            />
          </div>

          <AuthField
            icon={<MailIcon />}
            label="Email professionnel"
            type="email"
            name="email"
            placeholder="contact@mon-etablissement.fr"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            required
          />

          <AuthField
            icon={<PhoneIcon />}
            label="Téléphone"
            type="tel"
            name="phone"
            placeholder="06 00 00 00 00"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            required={config.needsPhone}
          />

          <PasswordField
            value={form.password}
            onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
            name="new-password"
          />

          <button type="submit" className="auth-btn-primary" disabled={submitting}>
            {config.cta}
          </button>
        </form>

        <p className="auth-footer-link">
          J&apos;ai déjà un compte{' '}
          <Link to="/auth">Me connecter</Link>
        </p>
      </div>
    </div>
  );
}
