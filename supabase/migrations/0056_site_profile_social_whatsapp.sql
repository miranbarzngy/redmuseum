-- WhatsApp link alongside the other social columns (0040/0055). NULL = never
-- set; no shipped default URL, so the button stays hidden until an admin
-- saves a link on /admin/profile.

alter table public.site_profile
  add column if not exists social_whatsapp_url text;

notify pgrst, 'reload schema';
