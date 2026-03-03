-- Insert default settings for About section
-- Run this SQL in your Supabase SQL Editor

-- Insert default settings if not exists
INSERT INTO settings (id, about_title_en, about_title_kr, about_text_en, about_text_kr, museums_count, archives_count, visitors_count)
VALUES (
  1,
  'Not To Be Forgotten',
  'تا لە یادمان نەچێت',
  'Visit us to explore multiple museums dedicated to the profound history of the Kurdish genocide. Each exhibit honors the resilience and stories of the Kurdish people. Join us in preserving this history.',
  'سەردانمان بکەن بۆ بینینی چەندین مۆزەی تایبەت بە مێژووی جینۆسایدی کورد. هەر مۆزەیەک پیاناسەیە بۆ بەشێک لەو چیرۆکە خۆڕاگرییانەی گەلی کورد. لەگەڵمان بن لە پاراستنی ئەم مێژووە.',
  11,
  1798,
  900
)
ON CONFLICT (id) DO UPDATE SET
  about_title_en = EXCLUDED.about_title_en,
  about_title_kr = EXCLUDED.about_title_kr,
  about_text_en = EXCLUDED.about_text_en,
  about_text_kr = EXCLUDED.about_text_kr,
  museums_count = EXCLUDED.museums_count,
  archives_count = EXCLUDED.archives_count,
  visitors_count = EXCLUDED.visitors_count,
  updated_at = NOW();
