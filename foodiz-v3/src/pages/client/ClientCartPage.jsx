import { useEffect, useMemo, useState } from 'react';
import { ClientEmptyState } from '../../components/client/ClientEmptyState';
import { ClientSectionHeader } from '../../components/client/ClientSectionHeader';
import { fetchClientCartItems, formatPrice } from '../../lib/clientApi';

export function ClientCartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchClientCartItems().then((result) => {
      if (!mounted) return;
      setItems(result.data || []);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.line_customer_subtotal_cents || 0), 0),
    [items]
  );

  return (
    <div className="client-page-stack">
      <section className="client-section premium-card">
        <ClientSectionHeader title="Panier" description="Votre panier Foodiz, fidèle au total client visible." />

        {loading ? (
          <div className="client-list-skeleton">Chargement du panier…</div>
        ) : items.length ? (
          <div className="client-list-stack">
            {items.map((item) => (
              <article key={item.cart_item_id} className="cart-item premium-card">
                <div>
                  <h3>{item.product_name}</h3>
                  <p>Quantité : {item.quantity}</p>
                  <p>Disponible : {item.is_available ? 'Oui' : 'Non'}</p>
                </div>
                <div className="cart-item__summary">
                  <strong>{formatPrice(item.customer_unit_price_cents)}</strong>
                  <span>{formatPrice(item.line_customer_subtotal_cents)}</span>
                </div>
              </article>
            ))}

            <div className="cart-total premium-card">
              <span>Total client</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>
        ) : (
          <ClientEmptyState title="Votre panier est vide" description="Ajoutez des produits pour construire votre prochaine commande Foodiz." />
        )}
      </section>
    </div>
  );
}
