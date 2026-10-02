-- Amna Suraka museum site — swaps the notification sounds 0068 allowed
-- (chime / bell / doorbell / alert, carried over from another project) for
-- museum-appropriate ones: a gallery-hall chime, santur, a bronze singing
-- bowl and daf. See src/lib/notificationSounds.ts.
--
-- A saved sound that's no longer offered falls back to 'default' (the
-- phone's own sound). Idempotent — safe to re-run.

alter table public.system_settings
  drop constraint if exists system_settings_notification_sound_check;

update public.system_settings
  set notification_sound = 'default'
  where notification_sound not in ('default', 'gallery', 'santur', 'bronze', 'daf');

alter table public.system_settings
  add constraint system_settings_notification_sound_check
  check (notification_sound in ('default', 'gallery', 'santur', 'bronze', 'daf'));
