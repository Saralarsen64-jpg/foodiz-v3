import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionCard } from '../../components/ui/SectionCard';
import { useAuth } from '../../components/auth/AuthProvider';
import { supabase } from '../../lib/supabaseClient';

/**
 * Gate page for the courier area, mirroring PartnerHomePage:
 *   - no public.couriers row -> /courier/onboarding
 *   - row exists but not approved -> pending/rejected/suspended screen
 *   - approved -> placeholder for the future courier dashboard.
 */
export function CourierHomePage() {
  const { session } = useAuth();
  const [courier, setCourier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase || !session?.user?.id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('couriers')
        .select('id, validation_status')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (!active) return;
      setCourier(data ?? null);
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
        <SectionCard title="Chargement" description="Lecture de votre dossier livreur…" />
      </div>
    );
  }

  if (!courier) {
    return (
      <div className="page-stack">
        <SectionCard
          title="Finalisez votre candidature"
          description="Avant d’accéder à votre espace livreur, confirmez votre engagement pour ouvrir votre dossier."
        >
          <Link className="gold-button" to="/courier/onboarding">
            Compléter ma candidature
          </Link>
        </SectionCard>
      </div>
    );
  }

  if (courier.validation_status !== 'approved') {
    const labels = {
      pending: {
        title: 'Candidature en cours de validation',
        description:
          'Un administrateur Foodiz examine votre dossier. La validation est généralement prononcée sous 24 à 48 heures.',
      },
      rejected: {
        title: 'Candidature refusée',
        description:
          'Votre dossier n’a pas pu être validé. Contactez le support Foodiz pour connaître la marche à suivre.',
      },
      suspended: {
        title: 'Compte suspendu',
        description:
          'Votre accès livreur est temporairement suspendu. Contactez le support Foodiz.',
      },
    };
    const copy = labels[courier.validation_status] ?? labels.pending;
    return (
      <div className="page-stack">
        <SectionCard title={copy.title} description={copy.description}>
          <p className="muted">Statut actuel : {courier.validation_status}</p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionCard
        title="Espace livreur"
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
