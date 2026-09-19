-- Amna Suraka museum site — the new /contact page adds a "subject" dropdown
-- to the public contact form so visitors can flag what their message is
-- about, and the admin inbox can badge each card with it.
--
-- A similar column ("type": commission/media/other) existed briefly and was
-- deliberately dropped in 0031_drop_contact_message_type.sql because the
-- public form no longer collected it — those options were leftover from a
-- different (non-museum) template. This is a fresh, museum-appropriate set
-- of categories, reintroduced on purpose rather than reverting that change.
--
-- not null with a default so existing rows (and any insert that omits it)
-- fall back to 'general' instead of failing.

alter table public.contact_messages
  add column if not exists subject text not null default 'general'
  check (subject in ('general', 'visit', 'media', 'partnership', 'other'));

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- column may still 404 from the API for up to a minute).
notify pgrst, 'reload schema';
