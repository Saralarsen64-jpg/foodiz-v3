const badgeLabels = {
  restaurant: 'Sélection locale',
  courier: 'Expérience premium',
};

export function ProfessionalAccessCard({
  icon,
  title,
  text,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  variant = 'restaurant',
  imageSrc,
}) {
  return (
    <article className={`pro-card premium-card pro-card--${variant}`}>
      <div className="pro-card__header">
        <div className="pro-card__icon">{icon}</div>
        <span className="pro-card__badge">{badgeLabels[variant]}</span>
      </div>

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

      <div className="pro-card__visual" aria-hidden="true">
        {imageSrc ? <img className="pro-card__image" src={imageSrc} alt="" loading="lazy" /> : null}
        <span className="pro-card__visual-overlay" />
        <span className="pro-card__visual-sheen" />
      </div>
    </article>
  );
}
