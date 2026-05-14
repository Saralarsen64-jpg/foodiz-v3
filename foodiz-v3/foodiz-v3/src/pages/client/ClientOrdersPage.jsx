import { useEffect, useState } from 'react';
import { ClientEmptyState } from '../../components/client/ClientEmptyState';
import { ClientSectionHeader } from '../../components/client/ClientSectionHeader';
import { fetchClientOrders, formatPrice } from '../../lib/clientApi';

export function ClientOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchClientOrders().then((result) => {
      if (!mounted) return;
      setOrders(result.data || []);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="client-page-stack">
      <section className="client-section premium-card">
        <ClientSectionHeader title="Commandes" description="Vos commandes Foodiz, statuts et totaux client visibles dans une seule vue." />

        {loading ? (
          <div className="client-list-skeleton">Chargement des commandes…</div>
        ) : orders.length ? (
          <div className="client-list-stack">
            {orders.map((order) => (
              <article key={order.order_id} className="order-card premium-card">
                <div>
                  <h3>{order.partner_display_name}</h3>
                  <p>Commande : {order.order_status}</p>
                  <p>Livraison : {order.delivery_status || 'En attente'}</p>
                  <p>Paiement : {order.payment_status || 'En attente'}</p>
                </div>
                <strong>{formatPrice(order.total_customer_cents)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <ClientEmptyState title="Aucune commande pour le moment" description="Vos futures commandes Foodiz apparaîtront ici." />
        )}
      </section>
    </div>
  );
}
