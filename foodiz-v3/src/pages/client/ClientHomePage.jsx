import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientCategoryChips } from '../../components/client/ClientCategoryChips';
import { ClientEmptyState } from '../../components/client/ClientEmptyState';
import { ClientSectionHeader } from '../../components/client/ClientSectionHeader';
import { PartnerCard } from '../../components/client/PartnerCard';
import { CLIENT_CATEGORIES, fetchPartners } from '../../lib/clientApi';

const quickLinks = [
  {
    title: 'Restaurants',
    subtitle: 'Sélection locale soignée',
    route: '/client/restaurants',
  },
  {
    title: 'Market',
    subtitle: 'Épiceries & essentiels',
    route: '/client/market',
  },
];

export function ClientHomePage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadHome() {
      setLoading(true);
      const [restaurantsResult, marketsResult] = await Promise.all([
        fetchPartners('restaurant'),
        fetchPartners('market'),
      ]);

      if (!mounted) return;

      setRestaurants(restaurantsResult.data || []);
      setMarkets(marketsResult.data || []);
      setLoading(false);
    }

    loadHome();

    return () => {
      mounted = false;
    };
  }, []);

  const highlightedPartners = useMemo(
    () => (activeCategory === 'Market' ? markets : restaurants).slice(0, 4),
    [activeCategory, markets, restaurants]
  );

  const filteredPartners = useMemo(() => {
    if (!search.trim()) return highlightedPartners;
    const lowered = search.toLowerCase();
    return highlightedPartners.filter((partner) => {
      const haystack = `${partner.display_name || ''} ${partner.description || ''} ${partner.city || ''}`.toLowerCase();
      return haystack.includes(lowered);
    });
  }, [highlightedPartners, search]);

  return (
    <div className="client-page-stack">
      <section className="client-home-hero premium-card">
        <div className="client-home-hero__content">
          <p className="eyebrow">Foodiz signature</p>
          <h2>Vos envies locales, sélectionnées avec soin.</h2>
          <p>
            Explorez les meilleures adresses de votre ville, entre restaurants premium,
            marchés de proximité et plaisirs gourmands du moment.
          </p>
        </div>

        <div className="client-home-hero__search premium-card">
          <span className="client-home-hero__search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            placeholder="Rechercher une adresse, un plat ou une envie"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      <div className="client-home-quick-grid">
        {quickLinks.map((item) => (
          <button
            key={item.route}
            type="button"
            className="client-home-quick-card premium-card"
            onClick={() => navigate(item.route)}
          >
            <span className="eyebrow">Accès rapide</span>
            <strong>{item.title}</strong>
            <p>{item.subtitle}</p>
          </button>
        ))}
      </div>

      <ClientCategoryChips categories={CLIENT_CATEGORIES} activeCategory={activeCategory} onSelect={setActiveCategory} />

      <section className="client-section premium-card">
        <ClientSectionHeader
          title={activeCategory === 'Market' ? 'Market du moment' : 'Restaurants du moment'}
          description="Une sélection fidèle à l’univers Foodiz, pensée pour une découverte locale premium."
          actionLabel={activeCategory === 'Market' ? 'Voir tout' : 'Explorer'}
          onAction={() => navigate(activeCategory === 'Market' ? '/client/market' : '/client/restaurants')}
        />

        {loading ? (
          <div className="client-grid client-grid--partners">
            {Array.from({ length: 4 }).map((_, index) => (
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
            title="Sélection en préparation"
            description="Aucun établissement n’est visible dans cette catégorie ou pour cette recherche."
          />
        )}
      </section>

      <section className="client-section premium-card">
        <ClientSectionHeader
          title="Sélection gourmande"
          description="Halal, asiatique, pizzas, burgers, gastronomique et gourmandises : toutes les envies dans le même univers premium."
        />
        <div className="client-highlight-grid">
          {CLIENT_CATEGORIES.slice(2).map((category) => (
            <button
              key={category}
              type="button"
              className="client-highlight-card"
              onClick={() => setActiveCategory(category)}
            >
              <span className="eyebrow">Catégorie</span>
              <strong>{category}</strong>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
