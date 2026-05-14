import { formatPrice } from '../../lib/clientApi';

export function ProductCard({ product }) {
  return (
    <article className="product-card premium-card">
      <div className="product-card__content">
        <div>
          <h3>{product?.name}</h3>
          <p>{product?.description || 'Produit Foodiz sélectionné.'}</p>
        </div>
        <div className="product-card__meta">
          <span className="product-card__price">{formatPrice(product?.customer_price_cents || 0)}</span>
          {product?.is_halal ? <span className="product-card__tag">Halal</span> : null}
          {product?.is_bestseller ? <span className="product-card__tag">Best-seller</span> : null}
        </div>
      </div>
      {product?.image_url ? <img className="product-card__image" src={product.image_url} alt={product.name} /> : null}
    </article>
  );
}
