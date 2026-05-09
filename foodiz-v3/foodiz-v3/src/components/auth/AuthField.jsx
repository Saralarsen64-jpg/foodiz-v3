export function AuthField({ icon, label, error, hint, className = '', ...props }) {
  return (
    <label className={`auth-field ${error ? 'auth-field--error' : ''} ${className}`.trim()}>
      {label ? <span className="auth-field__label">{label}</span> : null}
      <span className="auth-field__control">
        {icon ? <span className="auth-field__icon">{icon}</span> : null}
        <input {...props} className="auth-field__input" />
      </span>
      {error ? <span className="auth-field__message auth-field__message--error">{error}</span> : null}
      {!error && hint ? <span className="auth-field__message">{hint}</span> : null}
    </label>
  );
}
