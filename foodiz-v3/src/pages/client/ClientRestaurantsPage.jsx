import { useEffect, useMemo, useState } from 'react';
import { ClientCategoryChips } from '../../components/client/ClientCategoryChips';
import { ClientEmptyState } from '../../components/client/ClientEmptyState';
import { ClientSearchBar } from '../../components/client/ClientSearchBar';
import { ClientSectionHeader } from '../../components/client/ClientSectionHeader';
import { PartnerCard } from '../../components/client/PartnerCard';
import { fetchPartners } from '../../lib/clientApi';

const restaurantFilters = ['Restaurants', 'Halal', 'Asiatique', 'Pizzas', 'Burgers', 'Gastronomique', 'Gourmandises'];

export function ClientRestaurantsPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Restaurants');

  useEffect(() => {
    let mounted = true;
    fetchPartners('restaurant').then((result) => {
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
        activeCategory === 'Restaurants' ||
        (activeCategory === 'Halal' && partner.is_halal) ||
        haystack.includes(activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, partners, search]);

  return (
    <div className="client-page-stack">
      <section className="client-collection-hero premium-card">
        <div>
          <p className="eyebrow">Restaurants Foodiz</p>
          <h2>Des adresses locales, choisies pour leur caractère.</h2>
          <p>
            Explorez une sélection premium de restaurants, entre tables gastronomiques,
            burgers signatures, pizzas artisanales et envies du moment.
          </p>
        </div>
        <ClientSearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un restaurant, une cuisine ou une envie"
        />
      </section>

      <ClientCategoryChips
        categories={restaurantFilters}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      <section className="client-section premium-card">
        <ClientSectionHeader
          title="Sélection restaurants"
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
            title="Aucun restaurant pour ce filtre"
            description="Essayez une autre recherche ou explorez une autre catégorie Foodiz."
          />
        )}
      </section>
    </div>
  );
}
