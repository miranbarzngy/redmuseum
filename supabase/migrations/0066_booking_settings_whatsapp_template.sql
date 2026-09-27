-- Amna Suraka museum site — the WhatsApp message the admin sends a visitor
-- once their booking is accepted. Edited under /admin/bookings/schedule;
-- the bookings board fills in its {name} / {date} / {time} / {guests} /
-- {code} / {link} placeholders per booking and opens it in WhatsApp
-- (wa.me) for the admin to send. An empty template hides the send buttons.
--
-- booking_settings is publicly readable (0036). That's fine for this
-- column too: it's the text visitors receive anyway, nothing internal.
--
-- Keep the default in sync with DEFAULT_ACCEPT_MESSAGE in
-- src/app/admin/(dashboard)/bookings/acceptMessage.ts.

alter table public.booking_settings
  add column if not exists whatsapp_accept_template text not null default 'سڵاو {name}،
داواکاریی سەردانەکەت بۆ مۆزەخانەی نیشتیمانی ئەمنە سورەکە پەسەند کرا.

بەرواری سەردان: {date}
کاتژمێر: {time}
ژمارەی میوان: {guests}
ژمارەی سەردان: {code}

کۆدی QR ـەکەت لەم لینکەدایە، لە کاتی هاتندا پیشانی بدە:
{link}

چاوەڕوانی سەردانەکەتین.'
    constraint booking_settings_whatsapp_accept_template_length
      check (char_length(whatsapp_accept_template) <= 1000);

notify pgrst, 'reload schema';
