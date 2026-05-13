export function ClientSearchBar({ value, onChange, placeholder = 'Rechercher…' }) {
  return (
    <label className="client-search-bar premium-card">
      <span className="client-search-bar__icon" aria-hidden="true">
        ⌕
      </span>
      <input type="search" value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  );
}
