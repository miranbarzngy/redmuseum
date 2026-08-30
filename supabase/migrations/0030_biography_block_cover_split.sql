-- Amna Suraka museum site — the section cover (image_url) is now a
-- standalone field, edited separately from the image_urls gallery of
-- *additional* photos. Migration 0029 briefly folded the cover in as the
-- first gallery entry; strip it back out so image_urls holds only extras.

update public.biography_blocks
set image_urls = coalesce(
      (
        select jsonb_agg(u.value order by u.ordinality)
        from jsonb_array_elements_text(image_urls) with ordinality as u(value, ordinality)
        where u.value is distinct from image_url
      ),
      '[]'::jsonb
    )
where image_url is not null
  and image_urls @> to_jsonb(image_url);
