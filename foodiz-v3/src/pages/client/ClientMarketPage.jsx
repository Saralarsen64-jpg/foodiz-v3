import { useEffect, useState } from 'react';
import { ClientEmptyState } from '../../components/client/ClientEmptyState';
import { ClientSectionHeader } from '../../components/client/ClientSectionHeader';
import { PartnerCard } from '../../components/client/PartnerCard';
import { fetchPartners } from '../../lib/clientApi';

export function ClientMarketPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchPartners('market').then((result) => {
      if (!mounted) return;
      setPartners(result.data || []);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="client-page-stack">
      <section className="client-section premium-card">
        <ClientSectionHeader
          title="Market"
          description="Épiceries et commerces de proximité visibles dans l’univers client Foodiz."
        />
        {loading ? (
          <div className="client-grid client-grid--partners">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="partner-card premium-card partner-card--skeleton" />
            ))}
          </div>
        ) : partners.length ? (
          <div className="client-grid client-grid--partners">
            {partners.map((partner) => (
              <PartnerCard key={partner.partner_id} partner={partner} />
            ))}
          </div>
        ) : (
          <ClientEmptyState
            title="Aucun market disponible"
            description="La sélection market sera affichée ici dès qu’elle sera disponible."
          />
        )}
      </section>
    </div>
  );
}
