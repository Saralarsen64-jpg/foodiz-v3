import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import { supabase } from '../../lib/supabaseClient';
import { SectionCard } from '../../components/ui/SectionCard';

/**
 * Courier onboarding — Workflow 7.3 of FOODIZ_TECHNICAL_BLUEPRINT_v1.1.
 *
 * The MVP courier signup is intentionally minimal: per the master spec §4.3,
 * the courier just creates an account and waits for manual admin validation.
 * Documents and vehicle info are not required at this stage (they will be
 * tracked in later iterations once the related tables exist).
 *
 * Steps:
 *   1. (already done) auth.users + profiles(role=courier) created via signup.
 *   2. Acknowledge the conditions, then insert public.couriers with
 *      validation_status = pending.
 *   3. Redirect to /courier where CourierHomePage shows the pending state.
 */
export function CourierOnboardingPage() {
  const navigate = useNavigate();
  const { profile, session } = useAuth();

  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existing, setExisting] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    async function check() {
      if (!supabase || !session?.user?.id) {
        setChecking(false);
        return;
      }
      const { data } = await supabase
        .from('couriers')
        .select('id, validation_status')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (!active) return;
      if (data) setExisting(data);
      setChecking(false);
    }
    check();
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!acknowledged) {
      setError('Merci d’accepter les conditions avant de soumettre votre candidature.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from('couriers')
        .insert({ user_id: session.user.id });
      if (insertError) throw insertError;
      navigate('/courier', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Erreur inattendue.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="page-stack">
        <SectionCard title="Chargement" description="Lecture de votre dossier livreur…" />
      </div>
    );
  }

  if (existing) {
    return (
      <div className="page-stack">
        <SectionCard
          title="Candidature déjà envoyée"
          description="Votre dossier livreur a été enregistré. Suivez son état depuis votre espace livreur."
        >
          <button className="gold-button" onClick={() => navigate('/courier', { replace: true })}>
            Aller à mon espace livreur
          </button>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionCard
        title={`Bienvenue ${profile?.first_name ?? ''} — finalisez votre candidature livreur`}
        description="Confirmez votre engagement, votre dossier sera ensuite revu manuellement par un administrateur Foodiz."
      >
        {error ? <div className="auth-feedback auth-feedback--error">{error}</div> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <ul className="feature-list">
            <li>Je m’engage à respecter les zones et créneaux que je définirai.</li>
            <li>Je m’engage à confirmer la récupération et la livraison de chaque commande.</li>
            <li>J’autorise Foodiz à utiliser ma position GPS pendant les livraisons.</li>
            <li>Je comprends que mon compte sera activé après validation manuelle.</li>
          </ul>

          <label
            className="auth-field"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>J’accepte les conditions ci-dessus</span>
          </label>

          <button className="gold-button auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Envoi en cours…' : 'Envoyer ma candidature'}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
