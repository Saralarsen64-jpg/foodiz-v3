import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionCard } from '../../components/ui/SectionCard';
import { useAuth } from '../../components/auth/AuthProvider';
import { supabase } from '../../lib/supabaseClient';

/**
 * Gate page for the partner area.
 *
 * Three states are possible after the user has logged in as a partner:
 *
 *   a) No public.partners row yet -> push them to /partner/onboarding so
 *      they can declare their establishment + upload mandatory documents.
 *   b) Row exists but validation_status != 'approved' -> show a friendly
 *      "pending / rejected / suspended" screen. Per master spec §4.2 Foodiz
 *      validates within 24-48h.
 *   c) validation_status == 'approved' -> placeholder for the future partner
 *      dashboard (catalog, orders, revenue, AI campaigns).
 */
export function PartnerHomePage() {
  const { session } = useAuth();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase || !session?.user?.id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('partners')
        .select('id, display_name, validation_status, rc_pro_due_at, rc_pro_received_at')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (!active) return;
      setPartner(data ?? null);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="page-stack">
        <SectionCard title="Chargement" description="Lecture de votre dossier partenaire…" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="page-stack">
        <SectionCard
          title="Finalisez votre inscription"
          description="Avant d’accéder à votre espace, complétez les informations de votre établissement et déposez les documents obligatoires."
        >
          <Link className="gold-button" to="/partner/onboarding">
            Compléter mon dossier
          </Link>
        </SectionCard>
      </div>
    );
  }

  if (partner.validation_status !== 'approved') {
    const labels = {
      pending: {
        title: 'Dossier en cours de validation',
        description:
          'Un administrateur Foodiz examine votre dossier. La validation est généralement prononcée sous 24 à 48 heures.',
      },
      rejected: {
        title: 'Dossier refusé',
        description:
          'Votre dossier n’a pas pu être validé. Contactez le support Foodiz pour connaître la marche à suivre.',
      },
      suspended: {
        title: 'Compte suspendu',
        description:
          'Votre accès partenaire est temporairement suspendu. Contactez le support Foodiz.',
      },
    };
    const copy = labels[partner.validation_status] ?? labels.pending;
    return (
      <div className="page-stack">
        <SectionCard title={copy.title} description={copy.description}>
          <ul className="feature-list">
            <li>Établissement : {partner.display_name}</li>
            <li>Statut : {partner.validation_status}</li>
            {partner.rc_pro_due_at ? (
              <li>
                RC PRO attendu avant le{' '}
                {new Date(partner.rc_pro_due_at).toLocaleDateString('fr-FR')}
              </li>
            ) : null}
          </ul>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionCard
        title={`Espace partenaire — ${partner.display_name}`}
        description="Placeholder propre pour catalogue, commandes, revenus, statistiques et campagnes notifications IA."
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
