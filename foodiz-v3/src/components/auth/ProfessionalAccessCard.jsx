export function ProfessionalAccessCard({ icon, title, text, primaryLabel, secondaryLabel, onPrimary, onSecondary }) {
  return (
    <article className="pro-card premium-card">
      <div className="pro-card__icon">{icon}</div>
      <div className="pro-card__content">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <div className="pro-card__actions">
        <button type="button" className="gold-button" onClick={onPrimary}>
          {primaryLabel}
        </button>
        <button type="button" className="dark-button" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      </div>
      <div className="pro-card__visual" aria-hidden="true" />
    </article>
  );
}
