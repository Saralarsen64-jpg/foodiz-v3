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
        <span className="pro-card__visual-overlay" />
        <span className="pro-card__mist pro-card__mist--left" />
        <span className="pro-card__mist pro-card__mist--right" />
        <span className="pro-card__spark pro-card__spark--1" />
        <span className="pro-card__spark pro-card__spark--2" />
        <span className="pro-card__spark pro-card__spark--3" />
        <span className="pro-card__subject pro-card__subject--one" />
        <span className="pro-card__subject pro-card__subject--two" />
        <span className="pro-card__subject pro-card__subject--three" />
        <span className="pro-card__subject pro-card__subject--four" />
      </div>
    </article>
  );
}
