import { SectionCard } from '../../components/ui/SectionCard';

export function AuthHomePage() {
  return (
    <div className="page-stack">
      <SectionCard
        title="Espace Auth"
        description="Placeholder premium pour connexion, création de compte, reset password et vérification email."
      >
        <ul className="feature-list">
          <li>Connexion Foodiz</li>
          <li>Création de compte</li>
          <li>Réinitialisation mot de passe</li>
          <li>Vérification email</li>
        </ul>
      </SectionCard>
    </div>
  );
}
