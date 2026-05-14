import { useMemo, useState } from 'react';
import { AuthField } from './AuthField';
import { EyeIcon, EyeOffIcon, LockIcon } from './AuthIcons';

export function PasswordField({ label, error, placeholder = 'Mot de passe', value, onChange, name = 'password' }) {
  const [visible, setVisible] = useState(false);

  const toggleLabel = useMemo(
    () => (visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'),
    [visible]
  );

  return (
    <div className="password-wrapper">
      <AuthField
        icon={<LockIcon />}
        label={label}
        error={error}
        type={visible ? 'text' : 'password'}
        name={name}
        placeholder={placeholder}
        autoComplete={name === 'password' ? 'current-password' : 'new-password'}
        value={value}
        onChange={onChange}
      />
      <button
        className="password-toggle"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={toggleLabel}
        title={toggleLabel}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
