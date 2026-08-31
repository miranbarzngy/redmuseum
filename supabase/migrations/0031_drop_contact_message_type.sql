-- The contact form's "inquiry type" field was removed — the public form no
-- longer collects it and the admin inbox no longer shows it. Drop the
-- column (with its check constraint) added in 0010.
alter table public.contact_messages
  drop column if exists type;
