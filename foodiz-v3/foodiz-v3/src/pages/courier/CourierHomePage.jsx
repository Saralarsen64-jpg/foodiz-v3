import { SectionCard } from '../../components/ui/SectionCard';

export function CourierHomePage() {
  return (
    <div className="page-stack">
      <SectionCard
        title="Surface Courier"
        description="Placeholder propre pour disponibilités, livraisons, suivi GPS et revenus."
      >
        <ul className="feature-list">
          <li>Disponibilités</li>
          <li>Livraisons disponibles</li>
          <li>Mission assignée</li>
          <li>Suivi GPS</li>
          <li>Revenus et statistiques</li>
        </ul>
      </SectionCard>
    </div>
  );
}
