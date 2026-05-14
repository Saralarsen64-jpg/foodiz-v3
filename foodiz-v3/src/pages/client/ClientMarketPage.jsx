import { useEffect, useMemo, useState } from 'react';
import { ClientCategoryChips } from '../../components/client/ClientCategoryChips';
import { ClientEmptyState } from '../../components/client/ClientEmptyState';
import { ClientSearchBar } from '../../components/client/ClientSearchBar';
import { ClientSectionHeader } from '../../components/client/ClientSectionHeader';
import { PartnerCard } from '../../components/client/PartnerCard';
import { fetchPartners } from '../../lib/clientApi';

const marketFilters = ['Market', 'Gourmandises', 'Halal'];

export function ClientMarketPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Market');

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

  const filteredPartners = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return partners.filter((partner) => {
      const haystack = `${partner.display_name || ''} ${partner.description || ''} ${partner.city || ''}`.toLowerCase();
      const matchesSearch = !lowered || haystack.includes(lowered);
      const matchesCategory =
        activeCategory === 'Market' ||
        (activeCategory === 'Halal' && partner.is_halal) ||
        haystack.includes(activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, partners, search]);

  return (
    <div className="client-page-stack">
      <section className="client-collection-hero premium-card">
        <div>
          <p className="eyebrow">Market Foodiz</p>
          <h2>Vos essentiels, dans une sélection locale plus raffinée.</h2>
          <p>
            Retrouvez épiceries, produits du quotidien, gourmandises et commerces de proximité,
            toujours dans le ton premium de Foodiz.
          </p>
        </div>
        <ClientSearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un market, une gourmandise ou un besoin"
        />
      </section>

      <ClientCategoryChips
        categories={marketFilters}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      <section className="client-section premium-card">
        <ClientSectionHeader
          title="Sélection market"
          description={`${filteredPartners.length} adresse${filteredPartners.length > 1 ? 's' : ''} visible${filteredPartners.length > 1 ? 's' : ''} dans votre univers Foodiz.`}
        />
        {loading ? (
          <div className="client-grid client-grid--partners">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="partner-card premium-card partner-card--skeleton" />
            ))}
          </div>
        ) : filteredPartners.length ? (
          <div className="client-grid client-grid--partners">
            {filteredPartners.map((partner) => (
              <PartnerCard key={partner.partner_id} partner={partner} />
            ))}
          </div>
        ) : (
          <ClientEmptyState
            title="Aucun market pour ce filtre"
            description="Essayez une autre recherche ou revenez à la sélection générale Foodiz."
          />
        )}
      </section>
    </div>
  );
}
