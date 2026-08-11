-- Amna Suraka museum site — optional image replacement for the Contact
-- section's studio-info card (the dark "ستۆدیۆ و پەیوەندی ڕاستەوخۆ" panel).
-- When set, the public Contact section shows this image instead of the
-- text card, at the same size/position — admin-editable from
-- /admin/profile alongside the existing hero image.

alter table public.site_profile
  add column if not exists contact_card_image_url text;
