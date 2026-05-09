import { SectionCard } from '../../components/ui/SectionCard';

export function PartnerHomePage() {
  return (
    <div className="page-stack">
      <SectionCard
        title="Surface Partner"
        description="Placeholder propre pour établissement, catalogue, commandes, revenus et validation."
      >
        <ul className="feature-list">
          <li>Gestion établissement</li>
          <li>Gestion produits</li>
          <li>Commandes</li>
          <li>Revenus et statistiques</li>
          <li>Notifications IA plus tard</li>
        </ul>
      </SectionCard>
    </div>
  );
}
