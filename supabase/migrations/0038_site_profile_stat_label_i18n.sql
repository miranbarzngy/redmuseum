-- Homepage stat cards (museums / archive / activities / visitors) flanking the
-- logo emblem used to be single-language and rendered unconditionally in
-- Kurdish. The whole "مێژووی مۆزەخانە" strip is localized now, so each label
-- gets the same _ku/_en/_ar triple every other content column uses. The
-- numeric *value* columns stay single — MuseumStatsPanel formats the digits
-- (Western for en, Arabic-Indic for ku/ar) per locale.
--
-- Written idempotently: the rename only fires if the pre-i18n column is still
-- there, and every add is `if not exists`, so this is safe to run on a DB at
-- any point between "0020 applied" and "0038 already applied".

do $$
declare
  stat text;
begin
  foreach stat in array array['museums', 'archive', 'activities', 'visitors'] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'site_profile'
        and column_name = 'stat_' || stat || '_label'
    ) then
      execute format(
        'alter table public.site_profile rename column stat_%1$s_label to stat_%1$s_label_ku',
        stat
      );
    end if;
  end loop;
end $$;

alter table public.site_profile
  add column if not exists stat_museums_label_ku text,
  add column if not exists stat_museums_label_en text,
  add column if not exists stat_museums_label_ar text,
  add column if not exists stat_archive_label_ku text,
  add column if not exists stat_archive_label_en text,
  add column if not exists stat_archive_label_ar text,
  add column if not exists stat_activities_label_ku text,
  add column if not exists stat_activities_label_en text,
  add column if not exists stat_activities_label_ar text,
  add column if not exists stat_visitors_label_ku text,
  add column if not exists stat_visitors_label_en text,
  add column if not exists stat_visitors_label_ar text;

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- columns may still 404 from the API for up to a minute).
notify pgrst, 'reload schema';
