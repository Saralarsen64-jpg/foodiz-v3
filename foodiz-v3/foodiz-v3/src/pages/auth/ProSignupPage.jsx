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
 * Mounted under /auth/partner and /auth/courier — the URL :role param
 * decides which copy + Supabase role gets used.
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

export function ProSignupPage() {
  const { role } = useParams();
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
    () => (config ? <p className="foodiz-auth-subtitle">{config.subtitle}</p> : null),
    [config]
  );

  if (!config) {
    return (
      <div className="foodiz-auth-page">
        <div className="foodiz-auth-frame">
          <section className="foodiz-auth-card premium-card">
            <h1>Rôle inconnu</h1>
            <p className="muted">
              Cette page est réservée aux inscriptions partenaire ou livreur.
            </p>
            <Link className="auth-link" to="/auth">
              Retour à l’accueil
            </Link>
          </section>
        </div>
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
        'Compte créé. Confirmez votre email pour accéder à la suite de l’inscription Foodiz.'
      );
    } else {
      setMessage('Compte créé. Redirection en cours…');
    }
    setSubmitting(false);
  }

  return (
    <div
      className="foodiz-auth-page"
      style={{ '--foodiz-auth-bg-image': `url(${authBackgroundMain})` }}
    >
      <div className="foodiz-auth-bg" aria-hidden="true">
        <div className="foodiz-auth-bg__triangle" />
        <div className="foodiz-auth-bg__fold-shadow" />
        <div className="foodiz-auth-bg__grain" />
        <div className="foodiz-auth-bg__fibers" />
      </div>

      <div className="foodiz-auth-frame">
        <header className="foodiz-auth-header">
          <div className="foodiz-auth-wordmark-wrap">
            <div className="foodiz-auth-wordmark">Foodiz</div>
            <span className="foodiz-auth-wordmark-underline" aria-hidden="true" />
          </div>
        </header>

        <section className="foodiz-auth-card premium-card">
          <div className="foodiz-auth-card__top">
            <p className="eyebrow">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ChefHatIcon /> {config.label}
              </span>
            </p>
            <h1>{config.title}</h1>
            {subtitleNode}
          </div>

          {!isSupabaseConfigured ? (
            <div className="auth-feedback auth-feedback--warning">
              <strong>Configuration locale incomplète.</strong>
              <span>{auth.supabaseConfigError}</span>
            </div>
          ) : null}

          {error ? <div className="auth-feedback auth-feedback--error">{error}</div> : null}
          {message ? (
            <div className="auth-feedback auth-feedback--success">{message}</div>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-grid-two">
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
              label="Mot de passe"
              value={form.password}
              onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
              name="new-password"
            />

            <button
              className="gold-button auth-submit"
              type="submit"
              disabled={submitting || !isSupabaseConfigured}
            >
              {config.cta}
            </button>

            <p className="auth-inline-text">
              J’ai déjà un compte{' '}
              <Link className="auth-link" to="/auth">
                Me connecter
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
