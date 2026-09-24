type SocialType = "instagram" | "facebook" | "x" | "youtube" | "tiktok" | "whatsapp";

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
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={className} {...commonProps}>
          <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.3 2 3.9 4.5 4.2" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" className={className} {...commonProps}>
          <path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.4 18.6z" />
          <path d="M9.3 8.8c.2 2.9 2.9 5.6 5.9 5.9l.9-1.3-1.7-.9-.8.7c-1-.4-2.2-1.6-2.6-2.6l.7-.8-.9-1.7z" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}
