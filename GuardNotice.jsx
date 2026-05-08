export function GuardNotice({ title, description }) {
  return (
    <div className="guard-notice premium-card">
      <p className="eyebrow">Mode fondation</p>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
    </div>
  );
}
