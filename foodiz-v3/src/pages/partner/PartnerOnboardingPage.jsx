import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import { supabase } from '../../lib/supabaseClient';
import { SectionCard } from '../../components/ui/SectionCard';

/**
 * Partner onboarding — Workflow 7.2 of FOODIZ_TECHNICAL_BLUEPRINT_v1.1:
 *
 *   1. (already done) auth.users + profiles(role=partner) created via signup +
 *      handle_new_user trigger.
 *   2. Insert public.partners with validation_status = pending.
 *   3. Compute rc_pro_due_at = now() + 7 days (master spec §4.2).
 *   4. Upload mandatory documents (siret, identity_document, kbis) to the
 *      private storage bucket `partner-documents-private` using the
 *      4-segment path enforced by storage_partner_document_path_is_valid().
 *   5. Insert one public.partner_documents row per uploaded file
 *      (verification_status defaults to pending_review).
 *
 * Once those steps succeed the page navigates to /partner where the
 * PartnerHomePage shows a "validation pending" state until an admin approves.
 */

const REQUIRED_DOCS = [
  { type: 'siret', label: 'Justificatif SIRET' },
  { type: 'identity_document', label: 'Pièce d’identité du dirigeant' },
  { type: 'kbis', label: 'Extrait KBIS' },
];

const ESTABLISHMENT_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'market', label: 'Épicerie / Market' },
];

const initialForm = {
  establishmentType: 'restaurant',
  legalName: '',
  displayName: '',
  description: '',
  siret: '',
  isHalal: false,
  minimumOrderEuros: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  city: '',
  countryCode: 'FR',
  // Latitude / longitude are required by the schema. In the absence of a
  // geocoder we let the user paste them manually with a sensible default.
  latitude: '',
  longitude: '',
};

function fileExtension(file) {
  const dot = file.name.lastIndexOf('.');
  return dot >= 0 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : 'bin';
}

function uuidv4() {
  // crypto.randomUUID is widely supported in modern browsers; fall back to a
  // simple polyfill for older runtimes used in tests.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function PartnerOnboardingPage() {
  const navigate = useNavigate();
  const { profile, session } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({}); // { siret: File, identity_document: File, kbis: File }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingPartnerId, setExistingPartnerId] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Detect whether the partner already submitted their establishment so we
  // don't let them create a duplicate row (the schema enforces UNIQUE on
  // partners.user_id anyway, but we want a friendly UX).
  useEffect(() => {
    let active = true;
    async function check() {
      if (!supabase || !session?.user?.id) {
        setCheckingExisting(false);
        return;
      }
      const { data } = await supabase
        .from('partners')
        .select('id, validation_status')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (!active) return;
      if (data) {
        setExistingPartnerId(data.id);
      }
      setCheckingExisting(false);
    }
    check();
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const missingDocs = useMemo(
    () => REQUIRED_DOCS.filter((d) => !files[d.type]),
    [files]
  );

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadDocument(partnerId, docType, file) {
    const ext = fileExtension(file);
    const fileId = uuidv4();
    // Path shape enforced by storage_partner_document_path_is_valid:
    //   partners/{partner_uuid}/{document_type}/{file_uuid}.{ext}
    const path = `partners/${partnerId}/${docType}/${fileId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('partner-documents-private')
      .upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (uploadError) throw new Error(`Upload ${docType} : ${uploadError.message}`);

    const { error: insertError } = await supabase.from('partner_documents').insert({
      partner_id: partnerId,
      document_type: docType,
      storage_path: path,
    });
    if (insertError) throw new Error(`Enregistrement ${docType} : ${insertError.message}`);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (existingPartnerId) {
      navigate('/partner', { replace: true });
      return;
    }

    if (missingDocs.length > 0) {
      setError(
        `Documents manquants : ${missingDocs.map((d) => d.label).join(', ')}.`
      );
      return;
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Latitude et longitude sont requises (valeurs numériques).');
      return;
    }
    const minOrder = form.minimumOrderEuros === '' ? 0 : parseFloat(form.minimumOrderEuros);
    if (Number.isNaN(minOrder) || minOrder < 0) {
      setError('Le minimum de commande doit être un nombre positif.');
      return;
    }

    setSubmitting(true);
    try {
      // 7-day RC PRO clock starts at signup per master spec §4.2.
      const rcProDueAt = new Date();
      rcProDueAt.setDate(rcProDueAt.getDate() + 7);

      const { data: partnerRow, error: partnerError } = await supabase
        .from('partners')
        .insert({
          user_id: session.user.id,
          establishment_type: form.establishmentType,
          legal_name: form.legalName.trim(),
          display_name: form.displayName.trim(),
          description: form.description.trim() || null,
          siret: form.siret.trim(),
          is_halal: !!form.isHalal,
          minimum_order_cents: Math.round(minOrder * 100),
          address_line_1: form.addressLine1.trim(),
          address_line_2: form.addressLine2.trim() || null,
          postal_code: form.postalCode.trim(),
          city: form.city.trim(),
          country_code: form.countryCode.trim().toUpperCase(),
          latitude: lat,
          longitude: lng,
          rc_pro_due_at: rcProDueAt.toISOString(),
        })
        .select('id')
        .single();
      if (partnerError) throw partnerError;

      // Upload docs sequentially — Supabase Storage rejects parallel uploads
      // to the same bucket fairly often and the user benefits from a clean
      // failure on the exact document that broke.
      for (const doc of REQUIRED_DOCS) {
        // eslint-disable-next-line no-await-in-loop
        await uploadDocument(partnerRow.id, doc.type, files[doc.type]);
      }

      navigate('/partner', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Erreur inattendue lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingExisting) {
    return (
      <div className="page-stack">
        <SectionCard title="Chargement" description="Lecture de votre dossier partenaire…" />
      </div>
    );
  }

  if (existingPartnerId) {
    return (
      <div className="page-stack">
        <SectionCard
          title="Dossier déjà soumis"
          description="Votre établissement a déjà été enregistré. Suivez l’état de validation depuis votre espace partenaire."
        >
          <button className="gold-button" onClick={() => navigate('/partner', { replace: true })}>
            Aller à mon espace partenaire
          </button>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionCard
        title={`Bienvenue ${profile?.first_name ?? ''} — finalisez votre inscription`}
        description="Renseignez les informations de votre établissement et déposez les documents obligatoires. Un administrateur Foodiz validera votre dossier sous 24 à 48h."
      >
        {error ? <div className="auth-feedback auth-feedback--error">{error}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <fieldset style={{ border: 0, padding: 0, display: 'grid', gap: 12 }}>
            <legend className="eyebrow">Établissement</legend>

            <label className="auth-field">
              <span className="auth-field__label">Type d’établissement</span>
              <span className="auth-field__control">
                <select
                  className="auth-field__input"
                  value={form.establishmentType}
                  onChange={(e) => update('establishmentType', e.target.value)}
                >
                  {ESTABLISHMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <div className="auth-grid-two">
              <label className="auth-field">
                <span className="auth-field__label">Raison sociale</span>
                <span className="auth-field__control">
                  <input
                    className="auth-field__input"
                    type="text"
                    required
                    value={form.legalName}
                    onChange={(e) => update('legalName', e.target.value)}
                  />
                </span>
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Nom commercial (visible client)</span>
                <span className="auth-field__control">
                  <input
                    className="auth-field__input"
                    type="text"
                    required
                    value={form.displayName}
                    onChange={(e) => update('displayName', e.target.value)}
                  />
                </span>
              </label>
            </div>

            <label className="auth-field">
              <span className="auth-field__label">Description (optionnelle)</span>
              <span className="auth-field__control">
                <textarea
                  className="auth-field__input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </span>
            </label>

            <div className="auth-grid-two">
              <label className="auth-field">
                <span className="auth-field__label">SIRET</span>
                <span className="auth-field__control">
                  <input
                    className="auth-field__input"
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.siret}
                    onChange={(e) => update('siret', e.target.value)}
                  />
                </span>
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Minimum de commande (€)</span>
                <span className="auth-field__control">
                  <input
                    className="auth-field__input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.minimumOrderEuros}
                    onChange={(e) => update('minimumOrderEuros', e.target.value)}
                  />
                </span>
              </label>
            </div>

            <label className="auth-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.isHalal}
                onChange={(e) => update('isHalal', e.target.checked)}
              />
              <span>Établissement halal</span>
            </label>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0, display: 'grid', gap: 12 }}>
            <legend className="eyebrow">Adresse</legend>

            <label className="auth-field">
              <span className="auth-field__label">Adresse</span>
              <span className="auth-field__control">
                <input
                  className="auth-field__input"
                  type="text"
                  required
                  value={form.addressLine1}
                  onChange={(e) => update('addressLine1', e.target.value)}
                />
              </span>
            </label>
            <label className="auth-field">
              <span className="auth-field__label">Complément (optionnel)</span>
              <span className="auth-field__control">
                <input
                  className="auth-field__input"
                  type="text"
                  value={form.addressLine2}
                  onChange={(e) => update('addressLine2', e.target.value)}
                />
              </span>
            </label>
            <div className="auth-grid-two">
              <label className="auth-field">
                <span className="auth-field__label">Code postal</span>
                <span className="auth-field__control">
                  <input
                    className="auth-field__input"
                    type="text"
                    required
                    value={form.postalCode}
                    onChange={(e) => update('postalCode', e.target.value)}
                  />
                </span>
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Ville</span>
                <span className="auth-field__control">
                  <input
                    className="auth-field__input"
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                  />
                </span>
              </label>
            </div>
            <div className="auth-grid-two">
              <label className="auth-field">
                <span className="auth-field__label">Pays (ISO 2)</span>
                <span className="auth-field__control">
                  <input
                    className="auth-field__input"
                    type="text"
                    maxLength={2}
                    required
                    value={form.countryCode}
                    onChange={(e) => update('countryCode', e.target.value.toUpperCase())}
                  />
                </span>
              </label>
              <div />
            </div>
            <div className="auth-grid-two">
              <label className="auth-field">
                <span className="auth-field__label">Latitude</span>
                <span className="auth-field__control">
                  <input
                    className="auth-field__input"
                    type="number"
                    step="0.000001"
                    required
                    value={form.latitude}
                    onChange={(e) => update('latitude', e.target.value)}
                  />
                </span>
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Longitude</span>
                <span className="auth-field__control">
                  <input
                    className="auth-field__input"
                    type="number"
                    step="0.000001"
                    required
                    value={form.longitude}
                    onChange={(e) => update('longitude', e.target.value)}
                  />
                </span>
              </label>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              Astuce : copiez les coordonnées depuis Google Maps (clic droit sur l’adresse).
            </p>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0, display: 'grid', gap: 12 }}>
            <legend className="eyebrow">Documents obligatoires</legend>
            {REQUIRED_DOCS.map((doc) => (
              <label key={doc.type} className="auth-field">
                <span className="auth-field__label">{doc.label}</span>
                <span className="auth-field__control">
                  <input
                    className="auth-field__input"
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) =>
                      setFiles((current) => ({ ...current, [doc.type]: e.target.files?.[0] ?? null }))
                    }
                  />
                </span>
                {files[doc.type] ? (
                  <span className="auth-field__message">Sélectionné : {files[doc.type].name}</span>
                ) : null}
              </label>
            ))}
            <p className="muted" style={{ fontSize: 13 }}>
              La RC PRO sera demandée séparément dans les 7 jours suivant l’inscription.
            </p>
          </fieldset>

          <button className="gold-button auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Envoi en cours…' : 'Soumettre mon dossier pour validation'}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
