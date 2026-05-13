import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClientEmptyState } from '../../components/client/ClientEmptyState';
import { ProductCard } from '../../components/client/ProductCard';
import { fetchPartnerById, fetchProductsByPartnerId, groupProductsByCategory } from '../../lib/clientApi';

export function ClientEstablishmentPage() {
  const { partnerId } = useParams();
  const [partner, setPartner] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      setLoading(true);
      const [partnerResult, productsResult] = await Promise.all([
        fetchPartnerById(partnerId),
        fetchProductsByPartnerId(partnerId),
      ]);

      if (!mounted) return;
      setPartner(partnerResult.data || null);
      setProducts(productsResult.data || []);
      setLoading(false);
    }

    loadDetail();

    return () => {
      mounted = false;
    };
  }, [partnerId]);

  const groupedProducts = useMemo(() => groupProductsByCategory(products), [products]);

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
        </div>
      </section>

      {Object.keys(groupedProducts).length ? (
        Object.entries(groupedProducts).map(([categoryId, items]) => (
          <section key={categoryId} className="client-section premium-card">
            <h2 className="client-simple-title">Catégorie {categoryId}</h2>
            <div className="client-list-stack">
              {items.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <ClientEmptyState title="Aucun produit visible" description="Les produits de cet établissement seront affichés ici dès qu’ils seront disponibles." />
      )}
    </div>
  );
}
