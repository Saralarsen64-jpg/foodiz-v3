import { SectionCard } from '../../components/ui/SectionCard';

export function ClientHomePage() {
  return (
    <div className="page-stack">
      <SectionCard
        title="Surface Client"
        description="Placeholder propre pour la future expérience client Foodiz."
      >
        <ul className="feature-list">
          <li>Recherche restaurants</li>
          <li>Recherche Market</li>
          <li>Panier et commandes</li>
          <li>Suivi de livraison</li>
          <li>Historique, fidélité, parrainage</li>
        </ul>
      </SectionCard>
    </div>
  );
}
