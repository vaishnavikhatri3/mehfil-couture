import { useId } from "react";

type P = { size?: number; className?: string };

export function InstagramIcon({ size = 18, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 18, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z" />
    </svg>
  );
}

/** Delicate jaali-inspired ornament — pure line work. */
export function Motif({ size = 120, className }: P) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="0.8" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="56" opacity=".5" />
      <circle cx="60" cy="60" r="44" opacity=".35" strokeDasharray="1.5 4" />
      {petals.map((d) => (
        <path key={d} d="M60 60 C 54 44, 56 26, 60 16 C 64 26, 66 44, 60 60Z" transform={`rotate(${d} 60 60)`} opacity=".8" />
      ))}
      <circle cx="60" cy="60" r="6" />
      <circle cx="60" cy="60" r="2" fill="currentColor" />
    </svg>
  );
}

/** Small four-point star used as a typographic dinkus. */
export function Dinkus({ size = 10, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" className={className} aria-hidden="true">
      <path d="M5 0 C5.4 3.6 6.4 4.6 10 5 C6.4 5.4 5.4 6.4 5 10 C4.6 6.4 3.6 5.4 0 5 C3.6 4.6 4.6 3.6 5 0Z" fill="currentColor" />
    </svg>
  );
}

/** Circular editorial stamp with text on a path. */
export function Stamp({ text, size = 132, className }: P & { text: string }) {
  const id = `stamp-${useId().replace(/:/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 132 132" className={className} aria-hidden="true">
      <defs>
        <path id={id} d="M66,66 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0" />
      </defs>
      <circle cx="66" cy="66" r="64" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".6" />
      <circle cx="66" cy="66" r="36" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".6" />
      <g className="stamp__ring">
        <text fontFamily="DM Mono, monospace" fontSize="8.6" fill="currentColor">
          <textPath href={`#${id}`} textLength="312" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </g>
      <text x="66" y="76" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="30" fill="currentColor">
        m
      </text>
    </svg>
  );
}
