import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import { AuthField } from '../../components/auth/AuthField';
import { PasswordField } from '../../components/auth/PasswordField';
import { ProfessionalAccessCard } from '../../components/auth/ProfessionalAccessCard';
import {
  BoltIcon,
  CardIcon,
  ChefHatIcon,
  MailIcon,
  PhoneIcon,
  ScooterIcon,
  SparkIcon,
  StoreIcon,
  SupportIcon,
  UserIcon,
} from '../../components/auth/AuthIcons';

const initialLogin = { email: '', password: '' };
const initialSignup = { firstName: '', lastName: '', email: '', phone: '', password: '' };
const initialReset = { email: '' };

function mapSupabaseError(error) {
  if (!error?.message) return 'Une erreur inattendue est survenue.';

  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }

  if (message.includes('user already registered')) {
    return 'Un compte existe déjà avec cet email.';
  }

  if (message.includes('password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }

  if (message.includes('email rate limit exceeded')) {
    return 'Trop de tentatives. Merci de réessayer dans quelques instants.';
  }

  return error.message;
}

function getAuthModeTitle(mode) {
  if (mode === 'signup') return 'Créer mon compte gourmand';
  if (mode === 'reset') return 'Réinitialiser mon mot de passe';
  return 'Connexion Foodiz';
}

export function AuthHomePage() {
  const navigate = useNavigate();
  const {
    session,
    profile,
    loading,
    profilePending,
    isSupabaseConfigured,
    supabaseConfigError,
    signIn,
    signUpClient,
    resetPassword,
    getRoleHomePath,
  } = useAuth();

  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [signupForm, setSignupForm] = useState(initialSignup);
  const [resetForm, setResetForm] = useState(initialReset);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null);
  const [formError, setFormError] = useState(null);
  const [proMessage, setProMessage] = useState('');

  useEffect(() => {
    if (session && profile?.role) {
      navigate(getRoleHomePath(profile.role), { replace: true });
    }
  }, [session, profile, navigate, getRoleHomePath]);

  const footerFeatures = useMemo(
    () => [
      { icon: <SparkIcon />, label: 'Qualité sélectionnée' },
      { icon: <BoltIcon />, label: 'Livraison rapide' },
      { icon: <CardIcon />, label: 'Paiement sécurisé' },
      { icon: <SupportIcon />, label: 'Support disponible' },
    ],
    []
  );

  function resetFeedback() {
    setFormMessage(null);
    setFormError(null);
  }

  async function handleLogin(event) {
    event.preventDefault();
    resetFeedback();
    setSubmitting(true);

    const { error } = await signIn(loginForm);

    if (error) {
      setFormError(mapSupabaseError(error));
      setSubmitting(false);
      return;
    }

    setFormMessage('Connexion en cours…');
    setSubmitting(false);
  }

  async function handleSignup(event) {
    event.preventDefault();
    resetFeedback();
    setSubmitting(true);

    const { error, data } = await signUpClient(signupForm);

    if (error) {
      setFormError(mapSupabaseError(error));
      setSubmitting(false);
      return;
    }

    if (!data?.session) {
      setFormMessage('Compte créé. Vérifiez votre email pour confirmer votre accès Foodiz.');
    } else {
      setFormMessage('Compte client Foodiz créé avec succès.');
    }

    setSubmitting(false);
  }

  async function handleReset(event) {
    event.preventDefault();
    resetFeedback();
    setSubmitting(true);

    const { error } = await resetPassword(resetForm.email);

    if (error) {
      setFormError(mapSupabaseError(error));
      setSubmitting(false);
      return;
    }

    setFormMessage('Un email de réinitialisation vient d’être envoyé si votre compte existe.');
    setSubmitting(false);
  }

  function handleProfessionalAction(type) {
    if (type === 'signup') {
      setProMessage('Demande d’accès bientôt disponible — validation admin requise.');
      return;
    }

    setProMessage('Accès professionnel bientôt disponible.');
  }

  const isBusy = loading || submitting;

  return (
    <div className="foodiz-auth-page">
      <div className="foodiz-auth-bg" aria-hidden="true">
        <div className="foodiz-auth-bg__triangle" />
        <div className="foodiz-auth-bg__fold-shadow" />
        <div className="foodiz-auth-bg__grain" />
        <div className="foodiz-auth-bg__fibers" />
      </div>

      <div className="foodiz-auth-frame">
        <header className="foodiz-auth-header">
          <div className="foodiz-auth-logo-wrap">
            <p className="foodiz-auth-kicker">Marketplace locale premium</p>
            <div className="foodiz-auth-logo">Foodiz</div>
            <span className="foodiz-auth-logo-underline" aria-hidden="true" />
          </div>
        </header>

        <section className="foodiz-auth-card premium-card">
          <div className="foodiz-auth-card__glow" aria-hidden="true" />
          <div className="foodiz-auth-card__top">
            <p className="eyebrow">Authentification</p>
            <h1>Envie de vous faire livrer&nbsp;?</h1>
            <p className="foodiz-auth-subtitle">
              Vos adresses préférées, vos envies du moment, livrées simplement.
            </p>
          </div>

          {!isSupabaseConfigured ? (
            <div className="auth-feedback auth-feedback--warning">
              <strong>Configuration locale incomplète.</strong>
              <span>{supabaseConfigError}</span>
            </div>
          ) : null}

          {profilePending ? (
            <div className="auth-feedback auth-feedback--warning">
              <strong>Votre profil est en cours de préparation.</strong>
              <span>Votre compte existe bien, mais votre profil Foodiz n’est pas encore finalisé.</span>
            </div>
          ) : null}

          <div className="auth-mode-toggle" role="tablist" aria-label="Mode authentification Foodiz">
            <button
              type="button"
              className={mode === 'login' || mode === 'reset' ? 'is-active' : ''}
              onClick={() => {
                setMode('login');
                resetFeedback();
              }}
            >
              Connexion
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'is-active' : ''}
              onClick={() => {
                setMode('signup');
                resetFeedback();
              }}
            >
              Inscription
            </button>
          </div>

          <div className="auth-form-title-row">
            <div>
              <h2>{getAuthModeTitle(mode)}</h2>
              <p className="auth-form-caption">
                {mode === 'signup'
                  ? 'Créez votre accès personnel pour retrouver vos envies Foodiz en quelques secondes.'
                  : mode === 'reset'
                    ? 'Saisissez votre email pour recevoir un lien sécurisé et retrouver votre accès.'
                    : 'Retrouvez vos favoris, vos adresses et vos commandes dans une expérience Foodiz premium.'}
              </p>
            </div>
            {isBusy ? <span className="status-pill">Chargement</span> : null}
          </div>

          {formError ? <div className="auth-feedback auth-feedback--error">{formError}</div> : null}
          {formMessage ? <div className="auth-feedback auth-feedback--success">{formMessage}</div> : null}

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <AuthField
                icon={<MailIcon />}
                label="Email"
                type="email"
                name="email"
                placeholder="bonjour@foodiz.co"
                autoComplete="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                required
              />

              <PasswordField
                label="Mot de passe"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              />

              <button className="gold-button auth-submit" type="submit" disabled={isBusy || !isSupabaseConfigured}>
                Me connecter
              </button>

              <button
                type="button"
                className="auth-link auth-link--subtle"
                onClick={() => {
                  setMode('reset');
                  resetFeedback();
                }}
              >
                Mot de passe oublié ?
              </button>

              <p className="auth-inline-text">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setMode('signup');
                    resetFeedback();
                  }}
                >
                  Créer mon compte gourmand
                </button>
              </p>
            </form>
          ) : null}

          {mode === 'signup' ? (
            <form className="auth-form" onSubmit={handleSignup}>
              <div className="auth-grid-two">
                <AuthField
                  icon={<UserIcon />}
                  label="Prénom"
                  type="text"
                  name="firstName"
                  placeholder="Lina"
                  autoComplete="given-name"
                  value={signupForm.firstName}
                  onChange={(event) => setSignupForm((current) => ({ ...current, firstName: event.target.value }))}
                  required
                />
                <AuthField
                  icon={<UserIcon />}
                  label="Nom"
                  type="text"
                  name="lastName"
                  placeholder="Martin"
                  autoComplete="family-name"
                  value={signupForm.lastName}
                  onChange={(event) => setSignupForm((current) => ({ ...current, lastName: event.target.value }))}
                  required
                />
              </div>

              <AuthField
                icon={<MailIcon />}
                label="Email"
                type="email"
                name="email"
                placeholder="bonjour@foodiz.co"
                autoComplete="email"
                value={signupForm.email}
                onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
                required
              />

              <AuthField
                icon={<PhoneIcon />}
                label="Téléphone (optionnel)"
                type="tel"
                name="phone"
                placeholder="06 00 00 00 00"
                autoComplete="tel"
                value={signupForm.phone}
                onChange={(event) => setSignupForm((current) => ({ ...current, phone: event.target.value }))}
              />

              <PasswordField
                label="Mot de passe"
                value={signupForm.password}
                onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))}
                name="new-password"
              />

              <button className="gold-button auth-submit" type="submit" disabled={isBusy || !isSupabaseConfigured}>
                Créer mon compte gourmand
              </button>

              <p className="auth-inline-text">
                J’ai déjà un compte{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setMode('login');
                    resetFeedback();
                  }}
                >
                  Me connecter
                </button>
              </p>
            </form>
          ) : null}

          {mode === 'reset' ? (
            <form className="auth-form" onSubmit={handleReset}>
              <AuthField
                icon={<MailIcon />}
                label="Email"
                type="email"
                name="email"
                placeholder="bonjour@foodiz.co"
                autoComplete="email"
                value={resetForm.email}
                onChange={(event) => setResetForm({ email: event.target.value })}
                required
              />

              <button className="gold-button auth-submit" type="submit" disabled={isBusy || !isSupabaseConfigured}>
                Envoyer le lien de réinitialisation
              </button>

              <p className="auth-inline-text">
                Retour à la{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setMode('login');
                    resetFeedback();
                  }}
                >
                  connexion
                </button>
              </p>
            </form>
          ) : null}

          <div className="pro-separator">
            <span />
            <div className="pro-separator__label">
              <ChefHatIcon />
              <span>Vous êtes professionnel ?</span>
            </div>
            <span />
          </div>

          <p className="pro-section-caption">
            Deux entrées dédiées pour rejoindre une expérience locale premium, lisible et plus soignée.
          </p>

          {proMessage ? <div className="auth-feedback auth-feedback--info">{proMessage}</div> : null}

          <div className="pro-grid">
            <ProfessionalAccessCard
              variant="restaurant"
              icon={<StoreIcon />}
              title="Restaurants & Épiciers"
              text="Faites découvrir vos meilleures offres aux clients de votre ville."
              primaryLabel="S’inscrire"
              secondaryLabel="Se connecter"
              onPrimary={() => handleProfessionalAction('signup')}
              onSecondary={() => handleProfessionalAction('login')}
            />
            <ProfessionalAccessCard
              variant="courier"
              icon={<ScooterIcon />}
              title="Livreurs"
              text="Rejoignez une expérience de livraison plus premium, plus claire, mieux pilotée."
              primaryLabel="S’inscrire"
              secondaryLabel="Se connecter"
              onPrimary={() => handleProfessionalAction('signup')}
              onSecondary={() => handleProfessionalAction('login')}
            />
          </div>

          <footer className="auth-footer-icons">
            {footerFeatures.map((feature) => (
              <div key={feature.label} className="auth-footer-icons__item">
                <span className="auth-footer-icons__icon">{feature.icon}</span>
                <span>{feature.label}</span>
              </div>
            ))}
          </footer>
        </section>
      </div>
    </div>
  );
}
