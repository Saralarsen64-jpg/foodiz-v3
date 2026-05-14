export function SectionCard({ title, description, children }) {
  return (
    <section className="section-card premium-card">
      <div className="section-card__header">
        <h2>{title}</h2>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
