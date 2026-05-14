import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { ClientEmptyState } from '../../components/client/ClientEmptyState';
import { fetchClientAddresses, fetchLoyaltyAccount } from '../../lib/clientApi';

const accountItems = [
  'Mes adresses',
  'Informations personnelles',
  'Parrainage',
  'Avantages Fidélité',
  'Historique de commandes',
  "Centre d'aide",
  'Supprimer mon compte',
];

export function ClientAccountPage() {
  const { profile } = useAuth();
  const [loyalty, setLoyalty] = useState(null);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (!profile?.user_id) return;
    fetchLoyaltyAccount(profile.user_id).then((result) => setLoyalty(result.data || null));
    fetchClientAddresses().then((result) => setAddresses(result.data || []));
  }, [profile?.user_id]);

  const points = useMemo(() => loyalty?.points_balance || 0, [loyalty]);

  return (
    <div className="client-page-stack">
      <section className="loyalty-card premium-card">
        <p className="eyebrow">Carte de fidélité</p>
        <h2>{points} points</h2>
        <p>1 euro dépensé = 1 point</p>
      </section>

      <section className="client-section premium-card">
        <div className="account-menu-list">
          {accountItems.map((item) => (
            <button key={item} type="button" className="account-menu-list__item">
              <span>{item}</span>
              <span aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </section>

      <section className="client-section premium-card">
        <h2 className="client-simple-title">Mes adresses</h2>
        {addresses.length ? (
          <div className="client-list-stack">
            {addresses.map((address) => (
              <article key={address.id} className="address-card premium-card">
                <strong>{address.label}</strong>
                <p>{address.address_line_1}</p>
                <p>
                  {address.postal_code} {address.city}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <ClientEmptyState title="Aucune adresse enregistrée" description="Vos adresses client apparaîtront ici dès qu’elles seront ajoutées." />
        )}
      </section>
    </div>
  );
}
