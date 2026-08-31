-- Homepage stat cards (museums / archive / activities / visitors) flanking the
-- logo emblem used to be single-language and rendered unconditionally in
-- Kurdish. The whole "مێژووی مۆزەخانە" strip is localized now, so each label
-- gets the same _ku/_en/_ar triple every other content column uses. The
-- numeric *value* columns stay single — MuseumStatsPanel formats the digits
-- (Western for en, Arabic-Indic for ku/ar) per locale.

alter table public.site_profile rename column stat_museums_label to stat_museums_label_ku;
alter table public.site_profile rename column stat_archive_label to stat_archive_label_ku;
alter table public.site_profile rename column stat_activities_label to stat_activities_label_ku;
alter table public.site_profile rename column stat_visitors_label to stat_visitors_label_ku;

alter table public.site_profile
  add column if not exists stat_museums_label_en text,
  add column if not exists stat_museums_label_ar text,
  add column if not exists stat_archive_label_en text,
  add column if not exists stat_archive_label_ar text,
  add column if not exists stat_activities_label_en text,
  add column if not exists stat_activities_label_ar text,
  add column if not exists stat_visitors_label_en text,
  add column if not exists stat_visitors_label_ar text;
