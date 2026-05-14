function IconWrapper({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function MailIcon() {
  return (
    <IconWrapper>
      <path d="M4 6h16v12H4z" />
      <path d="m4 8 8 6 8-6" />
    </IconWrapper>
  );
}

export function LockIcon() {
  return (
    <IconWrapper>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </IconWrapper>
  );
}

export function EyeIcon() {
  return (
    <IconWrapper>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </IconWrapper>
  );
}

export function EyeOffIcon() {
  return (
    <IconWrapper>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7A2.5 2.5 0 0 0 14 14" />
      <path d="M9.3 5.4A11.3 11.3 0 0 1 12 5c6.5 0 10 7 10 7a16.9 16.9 0 0 1-4.3 4.8" />
      <path d="M6.2 6.2A17.5 17.5 0 0 0 2 12s3.5 7 10 7a10.9 10.9 0 0 0 3-.4" />
    </IconWrapper>
  );
}

export function UserIcon() {
  return (
    <IconWrapper>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </IconWrapper>
  );
}

export function PhoneIcon() {
  return (
    <IconWrapper>
      <path d="M6 3h4l1 4-2 2a15 15 0 0 0 6 6l2-2 4 1v4c0 1-1 2-2 2A17 17 0 0 1 4 5c0-1 1-2 2-2Z" />
    </IconWrapper>
  );
}

export function ChefHatIcon() {
  return (
    <IconWrapper>
      <path d="M7 11a4 4 0 1 1 8 0 3 3 0 1 1 1 6H8a3 3 0 1 1-1-6Z" />
      <path d="M8 17v3h8v-3" />
    </IconWrapper>
  );
}

export function StoreIcon() {
  return (
    <IconWrapper>
      <path d="M4 8h16" />
      <path d="M5 8l1-4h12l1 4" />
      <path d="M6 8v10h12V8" />
      <path d="M10 18v-5h4v5" />
    </IconWrapper>
  );
}

export function ScooterIcon() {
  return (
    <IconWrapper>
      <circle cx="7" cy="17" r="2" />
      <circle cx="18" cy="17" r="2" />
      <path d="M9 17h5l3-6h-5l-1-3H8" />
      <path d="M14 8h4" />
    </IconWrapper>
  );
}

export function SparkIcon() {
  return (
    <IconWrapper>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="m5.6 5.6 2.8 2.8" />
      <path d="m15.6 15.6 2.8 2.8" />
      <path d="m5.6 18.4 2.8-2.8" />
      <path d="m15.6 8.4 2.8-2.8" />
    </IconWrapper>
  );
}

export function BoltIcon() {
  return (
    <IconWrapper>
      <path d="M13 2 6 13h5l-1 9 7-11h-5l1-9Z" />
    </IconWrapper>
  );
}

export function CardIcon() {
  return (
    <IconWrapper>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
    </IconWrapper>
  );
}

export function SupportIcon() {
  return (
    <IconWrapper>
      <path d="M5 13a7 7 0 1 1 14 0" />
      <path d="M5 13v4" />
      <path d="M19 13v4" />
      <path d="M9 20h6" />
    </IconWrapper>
  );
}
