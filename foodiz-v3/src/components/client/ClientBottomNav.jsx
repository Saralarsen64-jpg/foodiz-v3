import { NavLink } from 'react-router-dom';

const items = [
  { to: '/client/restaurants', label: 'Restaurants', icon: '🍽️' },
  { to: '/client/market', label: 'Market', icon: '🛍️' },
  { to: '/client/cart', label: 'Panier', icon: '🧺' },
  { to: '/client/orders', label: 'Commandes', icon: '🧾' },
  { to: '/client/account', label: 'Mon compte', icon: '👤' },
];

export function ClientBottomNav() {
  return (
    <nav className="client-bottom-nav" aria-label="Navigation principale client">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `client-bottom-nav__item ${isActive ? 'is-active' : ''}`}
        >
          <span className="client-bottom-nav__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="client-bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
