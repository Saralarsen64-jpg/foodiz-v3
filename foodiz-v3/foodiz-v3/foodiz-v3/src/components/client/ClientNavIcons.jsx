function IconBase({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function PlateIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M4 20h16" />
    </IconBase>
  );
}

export function BagIcon() {
  return (
    <IconBase>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </IconBase>
  );
}

export function CartIcon() {
  return (
    <IconBase>
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
      <path d="M4 5h2l2.3 9h8.9L20 8H7.1" />
    </IconBase>
  );
}

export function ReceiptIcon() {
  return (
    <IconBase>
      <path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V3h2Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </IconBase>
  );
}

export function UserCircleIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7.5 18a5.5 5.5 0 0 1 9 0" />
    </IconBase>
  );
}
