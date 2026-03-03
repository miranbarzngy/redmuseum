-- =============================================
-- SUPABASE SQL: Add Arabic columns to settings table
-- =============================================
-- Run this in your Supabase SQL Editor

-- Add Arabic columns to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS about_title_ar TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS about_text_ar TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS address_ar TEXT;

-- Optional: Add sample Arabic content for existing settings
UPDATE settings SET 
  about_title_ar = CASE 
    WHEN about_title_ar IS NULL THEN 'لن ننسى' 
    ELSE about_title_ar
  END,
  about_text_ar = CASE 
    WHEN about_text_ar IS NULL THEN 'زورنا لاستكشاف المتاحف المخصصة لتاريخ الابادة الجماعية الكردية. كل عرض يكرم صمود وقصص الشعب الكردي. انضموا الينا للحفاظ على هذا التاريخ.'
    ELSE about_text_ar
  END,
  address_ar = CASE 
    WHEN address_ar IS NULL THEN 'السليمانية، العراق'
    ELSE address_ar
  END
WHERE id = 1;

