import { SectionCard } from '../../components/ui/SectionCard';

export function AdminHomePage() {
  return (
    <div className="page-stack">
      <SectionCard
        title="Surface Admin"
        description="Placeholder propre pour validation, supervision, commandes, revenus et logs."
      >
        <ul className="feature-list">
          <li>Validation partners</li>
          <li>Validation couriers</li>
          <li>Gestion commandes</li>
          <li>Payouts et revenus</li>
          <li>Statistiques globales</li>
        </ul>
      </SectionCard>
    </div>
  );
}
