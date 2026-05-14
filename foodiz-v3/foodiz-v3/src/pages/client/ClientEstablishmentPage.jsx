import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ClientCategoryChips } from '../../components/client/ClientCategoryChips';
import { ClientEmptyState } from '../../components/client/ClientEmptyState';
import { ProductCard } from '../../components/client/ProductCard';
import { fetchCategories, fetchPartnerById, fetchProductsByPartnerId, formatPrice, groupProductsByCategory } from '../../lib/clientApi';

export function ClientEstablishmentPage() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      setLoading(true);
      const [partnerResult, productsResult, categoriesResult] = await Promise.all([
        fetchPartnerById(partnerId),
        fetchProductsByPartnerId(partnerId),
        fetchCategories(),
      ]);

      if (!mounted) return;
      setPartner(partnerResult.data || null);
      setProducts(productsResult.data || []);
      setCategories(categoriesResult.data || []);
      setLoading(false);
    }

    loadDetail();

    return () => {
      mounted = false;
    };
  }, [partnerId]);

  const groupedProducts = useMemo(() => groupProductsByCategory(products, categories), [products, categories]);
  const categoryNames = useMemo(() => Object.keys(groupedProducts), [groupedProducts]);

  useEffect(() => {
    if (categoryNames.length && !activeCategory) {
      setActiveCategory(categoryNames[0]);
    }
  }, [categoryNames, activeCategory]);

  if (loading) {
    return <div className="client-list-skeleton premium-card">Chargement de l’établissement…</div>;
  }

  if (!partner) {
    return <ClientEmptyState title="Établissement introuvable" description="Cette fiche sera disponible dès qu’un établissement public pourra être affiché." />;
  }

  return (
    <div className="client-page-stack">
      <section className="partner-detail-hero premium-card">
        {partner.cover_image_url ? <img src={partner.cover_image_url} alt={partner.display_name} /> : null}
        <div className="partner-detail-hero__overlay" />
        <div className="partner-detail-hero__content">
          <p className="eyebrow">{partner.establishment_type === 'market' ? 'Market' : 'Restaurant'}</p>
          <h2>{partner.display_name}</h2>
          <p>{partner.description}</p>
          <div className="partner-detail-hero__meta">
            <span>{partner.city || 'Votre ville'}</span>
            <span>Minimum {formatPrice(partner.minimum_order_cents || 0)}</span>
            {partner.is_halal ? <span className="partner-card__tag">Halal</span> : null}
          </div>
        </div>
      </section>

      {categoryNames.length ? (
        <ClientCategoryChips
          categories={categoryNames}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      ) : null}

      {categoryNames.length ? (
        <section className="client-section premium-card">
          <div className="client-section-header">
            <div>
              <h2>{activeCategory}</h2>
              <p>Produits visibles et prix client finaux dans l’univers Foodiz.</p>
            </div>
            <button type="button" className="client-link-button" onClick={() => navigate('/client/cart')}>
              Voir le panier
            </button>
          </div>
          <div className="client-list-stack">
            {(groupedProducts[activeCategory] || []).map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        </section>
      ) : (
        <ClientEmptyState title="Aucun produit visible" description="Les produits de cet établissement seront affichés ici dès qu’ils seront disponibles." />
      )}
    </div>
  );
}
