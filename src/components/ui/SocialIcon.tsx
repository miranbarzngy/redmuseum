type SocialType = "instagram" | "facebook" | "x" | "youtube";

const commonProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SocialIcon({ type, className }: { type: SocialType; className?: string }) {
  switch (type) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={className} {...commonProps}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={className} {...commonProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path
            d="M13.9 19v-6.4h2.1l.3-2.5h-2.4V8.4c0-.7.2-1.2 1.2-1.2h1.3V5c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.9H9.2v2.5h2.1V19h2.6z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={className} {...commonProps}>
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={className} {...commonProps}>
          <rect x="3" y="6" width="18" height="12" rx="4" />
          <path d="M10.5 9.8l4.3 2.2-4.3 2.2z" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}
