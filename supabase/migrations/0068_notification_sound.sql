-- Amna Suraka museum site — the sound admin phones play for booking /
-- message pushes, picked under /admin/settings. Valid ids are listed in
-- src/lib/notificationSounds.ts; each one maps to its own Android
-- notification channel (a channel's sound is fixed once created), so
-- src/lib/adminPush.ts reads this to pick the channel for every push.
--
-- Idempotent — safe to re-run.

alter table public.system_settings
  add column if not exists notification_sound text not null default 'default';

alter table public.system_settings
  drop constraint if exists system_settings_notification_sound_check;
alter table public.system_settings
  add constraint system_settings_notification_sound_check
  check (notification_sound in ('default', 'chime', 'bell', 'doorbell', 'alert'));
