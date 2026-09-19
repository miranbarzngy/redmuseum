// Shared between the public contact form (src/app/api/contact/route.ts,
// ContactPageClient) and the admin inbox badge (messages/MessageCard.tsx,
// MessageDrawer.tsx) — keeps the enum values in one place next to the
// contact_messages.subject check constraint (0047_contact_messages_subject.sql).
export const CONTACT_SUBJECTS = ["general", "visit", "media", "partnership", "other"] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

// The admin panel is Kurdish-only and doesn't use next-intl (see the rest of
// src/app/admin) — the public-facing form instead reads
// contact.form.subjectOptions.* from messages/*.json.
export const CONTACT_SUBJECT_LABELS_KU: Record<ContactSubject, string> = {
  general: "گشتی",
  visit: "سەردان و گروپ",
  media: "میدیا و ڕاگەیاندن",
  partnership: "هاوکاری",
  other: "هیتر",
};
