import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-panel premium-card">
        <div className="brand-mark">Foodiz</div>
        <p className="eyebrow">Marketplace premium locale de livraison</p>
        <h1>Fondation authentification</h1>
        <p className="muted">
          Espace de base pour les écrans d’authentification Foodiz. Le branding premium,
          chaleureux et gourmand est déjà chargé.
        </p>
        <Outlet />
      </div>
    </div>
  );
}
