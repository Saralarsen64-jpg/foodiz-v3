import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { ClientBottomNav } from './ClientBottomNav';

function getPageTitle(pathname) {
  if (pathname.includes('/market')) return 'Market';
  if (pathname.includes('/cart')) return 'Panier';
  if (pathname.includes('/orders')) return 'Commandes';
  if (pathname.includes('/account')) return 'Mon compte';
  if (pathname.includes('/restaurants')) return 'Restaurants';
  return 'Accueil';
}

export function ClientLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const firstName = profile?.first_name || 'Gourmand';

  return (
    <div className="client-shell">
      <header className="client-shell__header">
        <div>
          <p className="eyebrow">Foodiz</p>
          <h1>{getPageTitle(location.pathname)}</h1>
          <p className="client-shell__subtitle">Bonjour {firstName}</p>
        </div>
        <div className="client-shell__actions">
          <Link className="client-shell__ghost" to="/">
            Accueil
          </Link>
          <button className="client-shell__ghost" type="button" onClick={signOut}>
            Déconnexion
          </button>
        </div>
      </header>

      <main className="client-shell__content">
        <Outlet />
      </main>

      <ClientBottomNav />
    </div>
  );
}
