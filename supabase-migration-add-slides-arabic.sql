-- =============================================
-- SUPABASE SQL: Add Arabic columns to slides table
-- =============================================
-- Run this in your Supabase SQL Editor

-- Add Arabic columns to slides table
ALTER TABLE slides ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE slides ADD COLUMN IF NOT EXISTS subtitle_ar TEXT;
ALTER TABLE slides ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Optional: Add sample Arabic content for existing slides
UPDATE slides SET 
  title_ar = CASE slide_number
    WHEN 1 THEN 'السجن الأحمر'
    WHEN 2 THEN 'البيشمركة'
    WHEN 3 THEN 'السينما'
    WHEN 4 THEN 'التراث الكردي'
    WHEN 5 THEN 'السجون'
    WHEN 6 THEN 'متحف الألغام'
    WHEN 7 THEN 'الخروج'
    WHEN 8 THEN 'المرايا'
    WHEN 9 THEN 'شهداء حرب تنظيم الدولة'
    WHEN 10 THEN 'قاعة المعرض'
    WHEN 11 THEN 'أنفال'
    WHEN 12 THEN 'المقاومة'
    WHEN 13 THEN 'ساحة الأسلحة الثقيلة'
    ELSE title_ar
  END,
  subtitle_ar = 'متحف',
  description_ar = CASE slide_number
    WHEN 1 THEN 'تمثال الدكتاتور صدام حسين'
    WHEN 2 THEN 'البيشمركة سفير الكرم والحب'
    WHEN 3 THEN 'سينما يلماز غوناي'
    WHEN 4 THEN 'متحف التراث والثقافة'
    WHEN 5 THEN 'ظلت هذه السجون سليمة'
    WHEN 6 THEN 'مخصص لعرض جميع أنواع الألغام'
    WHEN 7 THEN 'بعد انتفاضة ربيع 1991'
    WHEN 8 THEN 'الجدران مغطاة بـ 182000 مرآة'
    WHEN 9 THEN 'في تلك الحرب غير المرغوبة مثلنا العالم'
    WHEN 10 THEN 'قاعة.gallery لعرض الأعمال الفنية'
    WHEN 11 THEN 'مخصص لعرض ضحايا أنفال'
    WHEN 12 THEN 'مخصص للسجناء السياسيين'
    WHEN 13 THEN 'مخصص لعرض الدبابات والمركبات العسكرية'
    ELSE description_ar
  END
WHERE title_ar IS NULL;
