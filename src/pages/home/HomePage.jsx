import { Link } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import { RouteGrid } from '../../components/ui/RouteGrid';
import { SectionCard } from '../../components/ui/SectionCard';

const routeItems = [
  {
    to: '/auth',
    label: 'Auth',
    title: 'Entrée authentification',
    description: 'Structure prête pour connexion, création de compte et vérifications futures.',
  },
  {
    to: '/client',
    label: 'Client',
    title: 'Surface client',
    description: 'Fondation prête pour recherche, panier, commandes et suivi.',
  },
  {
    to: '/partner',
    label: 'Partner',
    title: 'Surface partner',
    description: 'Base prête pour établissement, produits, commandes et revenus.',
  },
  {
    to: '/courier',
    label: 'Courier',
    title: 'Surface courier',
    description: 'Base prête pour disponibilités, livraisons, GPS et revenus.',
  },
  {
    to: '/admin',
    label: 'Admin',
    title: 'Surface admin',
    description: 'Base prête pour validation, supervision et statistiques globales.',
  },
];

export function HomePage() {
  const { isSupabaseConfigured, supabaseConfigError } = useAuth();

  return (
    <div className="landing-shell">
      <header className="hero premium-card">
        <div>
          <p className="eyebrow">Fondation frontend</p>
          <h1 className="brand-hero">Foodiz</h1>
          <p className="hero-text">
            Base React + Vite premium, chaleureuse et structurée pour le projet Foodiz.
            Le routing, les guards, le design system et les surfaces par rôle sont prêts.
          </p>
        </div>
        <div className="hero-status">
          <span className="status-pill">Vite + React</span>
          <span className="status-pill">Branding chargé</span>
          <span className="status-pill">Routing prêt</span>
        </div>
      </header>

      <SectionCard
        title="État de configuration"
        description="Aucune vraie clé n’est stockée dans le repo."
      >
        <div className="info-row">
          <span className={`status-dot ${isSupabaseConfigured ? 'status-dot--ok' : 'status-dot--warn'}`} />
          <div>
            <strong>{isSupabaseConfigured ? 'Supabase configuré localement' : 'Supabase non configuré localement'}</strong>
            <p className="muted">
              {isSupabaseConfigured
                ? 'Le client Supabase peut être utilisé avec vos variables locales.'
                : supabaseConfigError}
            </p>
          </div>
        </div>
        <Link className="button-link" to="/auth">
          Ouvrir l’espace auth
        </Link>
      </SectionCard>

      <SectionCard
        title="Surfaces prêtes"
        description="Les espaces par rôle sont déjà organisés pour les prochaines phases."
      >
        <RouteGrid items={routeItems} />
      </SectionCard>
    </div>
  );
}
