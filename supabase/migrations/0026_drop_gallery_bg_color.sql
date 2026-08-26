-- The public gallery section doesn't get its own configurable background
-- after all — it sits inside the same shared page background (PaintCanvas)
-- as every other homepage section, so a separate solid color just created a
-- visible seam. Drop the column added in 0025.
alter table public.system_settings
  drop column if exists gallery_bg_color;
