import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientCategoryChips } from '../../components/client/ClientCategoryChips';
import { ClientEmptyState } from '../../components/client/ClientEmptyState';
import { ClientSectionHeader } from '../../components/client/ClientSectionHeader';
import { PartnerCard } from '../../components/client/PartnerCard';
import { CLIENT_CATEGORIES, fetchPartners } from '../../lib/clientApi';

export function ClientHomePage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="client-page-stack">
      <section className="client-hero premium-card">
        <div>
          <p className="eyebrow">Foodiz sélection locale</p>
          <h2>Vos adresses préférées, quand vous le souhaitez.</h2>
          <p>
            Restaurants, épiceries et envies du moment, livrés simplement dans une expérience
            premium signée Foodiz.
          </p>
        </div>
      </section>

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
        ) : highlightedPartners.length ? (
          <div className="client-grid client-grid--partners">
            {highlightedPartners.map((partner) => (
              <PartnerCard key={partner.partner_id} partner={partner} />
            ))}
          </div>
        ) : (
          <ClientEmptyState
            title="Sélection en préparation"
            description="Aucun établissement n’est encore visible dans cette catégorie."
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
            <button key={category} type="button" className="client-highlight-card" onClick={() => setActiveCategory(category)}>
              <span className="eyebrow">Catégorie</span>
              <strong>{category}</strong>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
