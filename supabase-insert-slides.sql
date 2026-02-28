-- =============================================
-- INSERT SLIDES DATA (Run if tables exist)
-- =============================================

-- Insert slides (will skip if slide_number already exists)
INSERT INTO slides (slide_number, title, title_kr, subtitle, subtitle_kr, description, description_kr, background_image, museum_image, video_url, is_active) VALUES
(1, 'Red Prison', 'ئەمنە سورەکە', 'museum', 'مۆزەی', 'Statue of dictator Saddam Hussein', 'پەیکەری دیکتاتۆر سەدام حوسێن', '/assets/images/bg-1.jpg', '/assets/images/saddam2.png', '/assets/videos/peshmarga.mp4', true),
(2, 'Peshmarga', 'پێشمەرگە', 'museum', 'مۆزەی', 'Peshmerga is an ambassador of generosity and love', 'پێشمەرگە باڵویزی بەخشندەی و خۆشەویستی', '/assets/images/bg-2.jpg', '/assets/images/peshmarga.png', '/assets/videos/peshmarga.mp4', true),
(3, 'Cinema', 'سینەما', 'museum', 'مۆزەی', 'Yilmaz Gunay Cinema', 'سینەمای یەڵماز گونەی', '/assets/images/bg-3.jpg', '/assets/images/cinema.png', '/assets/videos/cinema.mp4', true),
(4, 'Kurdish Heritage', 'کلتور', 'museum', 'مۆزەی', 'cultural and heritage museum', 'شێخ مەحمود یەکەم مەلیکی کوردوستان', '/assets/images/bg-4.jpg', '/assets/images/malikshekhmahmud.png', '/assets/videos/Malikshexmahmud.mp4', true),
(5, 'Prisons', 'زیندانیان', 'museum', 'مۆزەی', 'These jails remained intact', 'ئەم بەشە تایبەت بووە بۆ هەڵواسین', '/assets/images/bg-5.jpg', '/assets/images/zindanyakan.png', '/assets/videos/zindanakan.mp4', true),
(6, 'Mine Museum', 'مین و تەقەمەنی', 'museum', 'مۆزەی', 'dedicated to displaying all types of mines', 'ئەم بەشە تایبەتە بە پیشاندان', '/assets/images/bg-6.jpg', '/assets/images/minwtaqamany.png', '/assets/videos/Min-taqmany.mp4', true),
(7, 'Exodus', 'کۆڕەو', 'museum', 'مۆزەی', 'After the 1991 spring uprising', 'دوای ڕاپەڕینی بەهاری ١٩٩١', '/assets/images/bg-koraw.jpg', '/assets/images/koraw.png', '/assets/videos/koraw.mp4', true),
(8, 'Mirrors', 'ئاوێنەکان', 'museum', 'مۆزەی', 'walls covered with 182000 mirrors', 'دویوارەکان ڕوپۆشکراووە بە ١٨٢٠٠٠ پارچە ئاوێنە', '/assets/images/bg-awenakan.jpg', '/assets/images/awenakan.png', '/assets/videos/awenakan.mp4', true),
(9, 'Martyrs of ISIS War', 'شەهیدانی打底', 'museum', 'مۆزەی', 'In that unwanted war we represented the world', 'لەو جەنگە نەخوازراوەدا نوێنەرایەتی جیهانمان کرد', '/assets/images/bg-isis.jpg', '/assets/images/isis.png', '/assets/videos/isis.mp4', true),
(10, 'Exhibition Hall', 'گەلەری', 'museum', 'مۆزەی', 'Gallery hall for exhibiting works', 'هۆڵی گەلەری بۆ نمایشکردنی کاری هونەری', '/assets/images/bg-gallery.jpg', '/assets/images/gallaery.png', '/assets/videos/gallery.mp4', true),
(11, 'Anfal', 'ئەنفال', 'museum', 'مۆزەی', 'dedicated to displaying victims of Anfal', 'تایبەتە بە نمایشکردنی ناو و وێنەی قوربانیان', '/assets/images/bg-anfal.jpg', '/assets/images/anfal.png', '/assets/videos/anfal.mp4', true),
(12, 'Resistance', 'خۆڕاگری', 'museum', 'مۆزەی', 'dedicated to political prisoners', 'تایبەتە بە ناو وێنەی ئەو زیندانییە سیاسیانە', '/assets/images/bg-xoragry.jpg', '/assets/images/xoragry.png', '/assets/videos/balganama.mp4', true),
(13, 'Heavy Weapons Square', 'گۆڕەپانی چەکی قورس', 'museum', 'مۆزەی', 'dedicated to displaying tanks and military vehicles', 'تایبەتە بە نمایشکردنی ئەو تانک و تۆپ', '/assets/images/bg-gorapan.jpg', '/assets/images/gorapan.png', '/assets/videos/red museum.mp4', true)
ON CONFLICT (slide_number) DO NOTHING;
