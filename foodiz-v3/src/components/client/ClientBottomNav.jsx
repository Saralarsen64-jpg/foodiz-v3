import { NavLink } from 'react-router-dom';
import { BagIcon, CartIcon, PlateIcon, ReceiptIcon, UserCircleIcon } from './ClientNavIcons';

const items = [
  { to: '/client/restaurants', label: 'Restaurants', icon: <PlateIcon /> },
  { to: '/client/market', label: 'Market', icon: <BagIcon /> },
  { to: '/client/cart', label: 'Panier', icon: <CartIcon /> },
  { to: '/client/orders', label: 'Commandes', icon: <ReceiptIcon /> },
  { to: '/client/account', label: 'Mon compte', icon: <UserCircleIcon /> },
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
