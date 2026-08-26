-- The gallery category icon field turned out to be unwanted — categories
-- no longer carry a Remix Icon class. Drop the column added in 0027.
alter table public.gallery_categories
  drop column if exists icon;
