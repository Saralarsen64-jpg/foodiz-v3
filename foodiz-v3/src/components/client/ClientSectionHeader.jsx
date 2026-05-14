export function ClientSectionHeader({ title, description, actionLabel, onAction }) {
  return (
    <div className="client-section-header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actionLabel ? (
        <button type="button" className="client-link-button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
