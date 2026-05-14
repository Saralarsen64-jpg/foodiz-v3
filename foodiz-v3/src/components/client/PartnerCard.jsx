import { Link } from 'react-router-dom';
import { formatPrice } from '../../lib/clientApi';

export function PartnerCard({ partner }) {
  const title = partner?.display_name || 'Établissement Foodiz';
  const description = partner?.description || 'Sélection locale premium';
  const image = partner?.cover_image_url || partner?.logo_url;
  const minimum = formatPrice(partner?.minimum_order_cents || 0);

  return (
    <Link className="partner-card premium-card" to={`/client/establishments/${partner?.partner_id || partner?.id}`}>
      <div className="partner-card__media">
        {image ? <img src={image} alt={title} /> : <div className="partner-card__fallback" />}
        <span className="partner-card__badge">{partner?.establishment_type === 'market' ? 'Market' : 'Restaurant'}</span>
      </div>
      <div className="partner-card__content">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="partner-card__meta">
          <span>{partner?.city || 'Votre ville'}</span>
          <span>Minimum {minimum}</span>
        </div>
        {partner?.is_halal ? <span className="partner-card__tag">Halal</span> : null}
      </div>
    </Link>
  );
}
