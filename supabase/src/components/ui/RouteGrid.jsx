import { Link } from 'react-router-dom';

export function RouteGrid({ items }) {
  return (
    <div className="route-grid">
      {items.map((item) => (
        <Link key={item.to} className="route-card premium-card" to={item.to}>
          <p className="eyebrow">{item.label}</p>
          <h3>{item.title}</h3>
          <p className="muted">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
