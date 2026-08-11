export interface SocialLink {
  type: "instagram" | "facebook" | "x" | "youtube";
  label: string;
  href: string;
}

// TODO: replace with the museum's real social profile URLs.
export const socials: SocialLink[] = [
  { type: "instagram", label: "Instagram", href: "https://instagram.com/amnasuraka" },
  { type: "facebook", label: "Facebook", href: "https://facebook.com/amnasuraka" },
  { type: "x", label: "X / Twitter", href: "https://x.com/amnasuraka" },
  { type: "youtube", label: "YouTube", href: "https://youtube.com/@amnasuraka" },
];
