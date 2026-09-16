-- The Contact section's custom image override never got used — the
-- studio-info card (email/location/socials) always shows now. Drop the
-- column added in 0011.
alter table public.site_profile
  drop column if exists contact_card_image_url;
