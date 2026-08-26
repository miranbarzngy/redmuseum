-- Optional seed data — the content that shipped with the static mockups,
-- carried over so a fresh Supabase project isn't empty on first deploy.
-- Safe to skip entirely; the admin panel can create everything from scratch.
-- Run after 0001_init.sql.

insert into public.paintings
  (title_ku, title_en, title_ar, description_ku, description_en, description_ar, medium_ku, medium_en, medium_ar, category, year)
values
  ($t$ئاگری نەورۆز$t$, $t$Newroz Fire$t$, $t$نار نوروز$t$,
   $t$بڵێسەی نەورۆز بەسەر چیاکاندا هەڵدەستێت، بە یەک بڵێسەی ڕەنگ چەندین سەدە نوێبوونەوە و بەرگری هەڵدەگرێت.$t$,
   $t$The flames of Newroz rise over the mountains, carrying centuries of renewal and resistance in a single blaze of color.$t$,
   $t$تتصاعد ألسنة نيران نوروز فوق الجبال، حاملةً قرونًا من التجدد والمقاومة في وميض واحد من الألوان.$t$,
   $t$ڕەنگی ڕۆن لەسەر کانڤاس$t$, $t$Oil on canvas$t$, $t$زيت على قماش$t$,
   'historical', 2016),

  ($t$ڕێپێوانی درێژ$t$, $t$The Long March$t$, $t$المسيرة الطويلة$t$,
   $t$کاروانێک لە خێزان سنوورێکی بێناو دەبڕنەوە، سیمایان گرانی و شکۆمەندی ئاوارەیی هەڵدەگرێت.$t$,
   $t$A procession of families crosses an unnamed border, their silhouettes carrying the weight and dignity of displacement.$t$,
   $t$موكب من العائلات يعبر حدودًا بلا اسم، تحمل ظلالهم ثقل النزوح وكرامته.$t$,
   $t$ڕەنگی ڕۆن لەسەر کانڤاس$t$, $t$Oil on canvas$t$, $t$زيت على قماش$t$,
   'historical', 2011),

  ($t$گەڕانەوە بۆ گوند$t$, $t$Return to the Village$t$, $t$العودة إلى القرية$t$,
   $t$بنیاتنانەوە بە بۆیاخکردنەوەی یەک دەرگا دەستپێدەکات — لێکۆڵینەوەیەکی هێمن دەربارەی گەڕانەوە دوای زیان.$t$,
   $t$Rebuilding begins with a single door repainted — a quiet study of homecoming after loss.$t$,
   $t$تبدأ إعادة البناء بإعادة طلاء باب واحد — تأمل هادئ في العودة بعد الفقد.$t$,
   $t$ئەکریلیک لەسەر کانڤاس$t$, $t$Acrylic on canvas$t$, $t$أكريليك على قماش$t$,
   'historical', 2019),

  ($t$یاریزانی مۆفتوونەکان$t$, $t$The Puppeteer$t$, $t$محرّك الدمى$t$,
   $t$لێکۆڵینەوەیەکی گاڵتەجاڕانە دەربارەی دەسەڵاتێک کە گوریسی ڕادەکێشێت و بەردەوام نکۆڵی لێدەکات.$t$,
   $t$A satirical study of power pulling strings it insists it does not hold.$t$,
   $t$دراسة ساخرة عن سلطة تسحب الخيوط بينما تنفي دائمًا أنها تفعل.$t$,
   $t$مەرەکەب لەسەر کاغەز$t$, $t$Ink on paper$t$, $t$حبر على ورق$t$,
   'political', 2014),

  ($t$بەڵێنە بەتاڵەکان$t$, $t$Empty Promises$t$, $t$وعود فارغة$t$,
   $t$مێزێکی وتار، مایکرۆفۆنێک و بۆشاییەکی گفتوگۆ کە بەلایەنی خۆیدا بەتاڵ هێڵراوە.$t$,
   $t$A podium, a microphone, and a speech bubble left deliberately blank.$t$,
   $t$منصة، ميكروفون، وفقاعة كلام تُركت فارغة عن قصد.$t$,
   $t$مەرەکەب لەسەر کاغەز$t$, $t$Ink on paper$t$, $t$حبر على ورق$t$,
   'political', 2017),

  ($t$تەختی لمی$t$, $t$Throne of Sand$t$, $t$عرش من الرمل$t$,
   $t$دەسەڵات وەک کاتژمێری لم وێنە دەکرێت — شکۆدار، بەڵام بەهێمنی بەرەو کۆتایی دەڕوات.$t$,
   $t$Authority rendered as an hourglass — magnificent, and quietly running out.$t$,
   $t$السلطة تُرسم كساعة رملية — مهيبة، وتنفد بهدوء.$t$,
   $t$تەکنیکی تێکەڵ لەسەر کانڤاس$t$, $t$Mixed media on canvas$t$, $t$تقنية مختلطة على قماش$t$,
   'political', 2020),

  ($t$چنراو$t$, $t$The Weaver$t$, $t$الحائكة$t$,
   $t$دەستێک کە هەزاران نەخشی هەڵگرتووە، لە نیوەی چنیندا وێنە کراوە.$t$,
   $t$Hands that have carried a thousand patterns, captured mid-thread.$t$,
   $t$يدان حملتا ألف نقشٍ، في لحظة غزل الخيط.$t$,
   $t$ڕەنگی ڕۆن لەسەر کانڤاس$t$, $t$Oil on canvas$t$, $t$زيت على قماش$t$,
   'portraits', 2013),

  ($t$پیری چیاکان$t$, $t$Elder of the Mountains$t$, $t$شيخ الجبال$t$,
   $t$ڕووێک بە با و ساڵان نەخشێنراوە، بە هێمنیی شایانی خۆی وێنە کراوە.$t$,
   $t$A face mapped by wind and years, painted with the patience it deserves.$t$,
   $t$وجهٌ رسمته الريح والسنون، رُسم بالصبر الذي يستحقه.$t$,
   $t$ڕەنگی ڕۆن لەسەر کانڤاس$t$, $t$Oil on canvas$t$, $t$زيت على قماش$t$,
   'portraits', 2015),

  ($t$کۆلبەر$t$, $t$Kolbar$t$, $t$كولبر$t$,
   $t$پۆرترێتی کۆلبەرانێک کە ئابووری هەرێمێک لەسەر شانیان هەڵدەگرن.$t$,
   $t$A portrait of the border porters who carry a region's economy on their backs.$t$,
   $t$بورتريه لحمّالي الحدود الذين يحملون اقتصاد منطقة بأكملها على ظهورهم.$t$,
   $t$خەڵووز لەسەر کاغەز$t$, $t$Charcoal on paper$t$, $t$فحم على ورق$t$,
   'portraits', 2018);

insert into public.exhibitions
  (year, title_ku, title_en, title_ar, details_ku, details_en, details_ar)
values
  ('1998', $t$یەکەم پێشانگای تاکە کەسی$t$, $t$First Solo Exhibition$t$, $t$أول معرض فردي$t$,
   $t$«یەکەم فڵچەکان» لە ناوەندێکی کولتووری خۆجێیی کرایەوە — یەکەم دەرکەوتنی گشتی کۆمەڵە کارێک کە بۆ چەندین دەیە گەشەی کرد.$t$,
   $t$"First Brushes" opens at a local cultural center — the earliest public showing of a body of work that would grow for decades.$t$,
   $t$افتتاح "أولى الفرشاة" في مركز ثقافي محلي — أول ظهور عام لمجموعة أعمال استمرت في النمو لعقود.$t$),

  ('2005', $t$ناسینەوەی نیشتمانی$t$, $t$National Recognition$t$, $t$اعتراف وطني$t$,
   $t$لە بیناڵێکی نیشتمانی هونەرە جوانەکاندا خەڵات وەرگرت لەبەر تابلۆیەکی مێژوویی دەربارەی کۆچ و یادگاری.$t$,
   $t$Awarded at a national fine arts biennial for a historical painting exploring migration and memory.$t$,
   $t$حصل على جائزة في بينالي وطني للفنون الجميلة عن لوحة تاريخية تتناول الهجرة والذاكرة.$t$),

  ('2011', $t$گەشتی ڕێپێوانی درێژ$t$, $t$The Long March Tour$t$, $t$جولة المسيرة الطويلة$t$,
   $t$زنجیرەیەک دەربارەی ئاوارەیی بە پێشانگا هەرێمییەکاندا گەشتی کرد، یەکەم سەرنجی ڕەخنەگرانەی فراوانی بۆ ڕاکێشا.$t$,
   $t$A series on displacement travels through regional galleries, drawing the first wide critical attention.$t$,
   $t$جالت سلسلة عن النزوح في معارض إقليمية، لتحظى بأول اهتمام نقدي واسع.$t$),

  ('2016', $t$زنجیرەی نەورۆز$t$, $t$The Newroz Series$t$, $t$سلسلة نوروز$t$,
   $t$پێشانگایەکی گەورەی تاکە کەسی لە مۆزەخانەیەکی هونەری هاوچەرخی هەرێمیدا، بە کارە گەورەکانی مێژوویی بەستراوەتەوە.$t$,
   $t$A major solo exhibition at a regional museum of modern art, anchored by large-scale historical works.$t$,
   $t$معرض فردي كبير في متحف إقليمي للفن الحديث، تمحور حول أعمال تاريخية واسعة النطاق.$t$),

  ('2019', $t$ژیانێک لەسەر کانڤاس — کۆکراوە$t$, $t$A Life on Canvas — Retrospective$t$, $t$حياة على القماش — معرض استعادي$t$,
   $t$بیست ساڵ کار لە پێشانگایەکی کۆکراوەی درێژایی کارەکەیدا کۆکرانەوە.$t$,
   $t$Two decades of work brought together in a career-spanning retrospective.$t$,
   $t$جمع عقدين من الأعمال في معرض استعادي يغطي مسيرة الفنان.$t$),

  ('2023', $t$پیشاندانی گروپی نێودەوڵەتی$t$, $t$International Group Showcase$t$, $t$معرض جماعي دولي$t$,
   $t$چەند کارێکی هەڵبژێردراو بەشدارن لە پێشانگایەکی نێودەوڵەتیدا کە تیشک دەخاتە سەر هونەرمەندە هاوچەرخەکانی دیاسپۆرای کورد.$t$,
   $t$Selected works join an international exhibition spotlighting the Kurdish diaspora's contemporary artists.$t$,
   $t$شاركت أعمال مختارة في معرض دولي يسلّط الضوء على فناني الشتات الكردي المعاصرين.$t$);

-- Biography section — the eyebrow/heading/intro plus the four paragraph
-- blocks, seeded with the same copy the site already falls back to (see
-- messages/*.json), so the admin form isn't empty. image_url is left null
-- for each block — the site shows placeholder art until real portrait
-- photos are uploaded via /admin/biography/blocks/[id].
insert into public.biography_intro
  (id, eyebrow_ku, eyebrow_en, eyebrow_ar, heading_ku, heading_en, heading_ar, intro_ku, intro_en, intro_ar)
values
  (1,
   $t$دەربارەی مۆزەخانەکە$t$, $t$About the Museum$t$, $t$عن المتحف$t$,
   $t$پاراستنی مێژوو، بەشداریکردنی یادگاری$t$, $t$Preserving History, Sharing Memory$t$, $t$حفظ التاريخ، ومشاركة الذاكرة$t$,
   $t$مۆزەخانەی نیشتیمانی ئەمنە سورەکە تەرخانکراوە بۆ پاراستنی مێژوو و بەشداریکردنی کۆکراوە، چیرۆک و یادگاری ئەم خاکە لەگەڵ گشت خەڵک.$t$,
   $t$The National Museum Amnasuraka is dedicated to preserving history and sharing the collections, stories, and memory of this land with the public.$t$,
   $t$يكرّس متحف أمنة سوركة الوطني جهوده لحفظ التاريخ ومشاركة مقتنيات هذه الأرض وقصصها وذاكرتها مع الجمهور.$t$)
on conflict (id) do update set
  eyebrow_ku = excluded.eyebrow_ku,
  eyebrow_en = excluded.eyebrow_en,
  eyebrow_ar = excluded.eyebrow_ar,
  heading_ku = excluded.heading_ku,
  heading_en = excluded.heading_en,
  heading_ar = excluded.heading_ar,
  intro_ku = excluded.intro_ku,
  intro_en = excluded.intro_en,
  intro_ar = excluded.intro_ar;

insert into public.biography_blocks
  (body_ku, body_en, body_ar, sort_order)
values
  ($t$لە بیناکەدا کە خۆی مێژوویەکی هەڵگرتووە، مۆزەخانەکە کەلوپەل، کارە هونەرییەکان و ئەرشیفەکان کۆدەکاتەوە کە چیرۆکی ئەم خاکە و خەڵکەکەی دەگێڕنەوە.$t$,
   $t$Housed in a building that itself carries history, the museum brings together artifacts, artworks, and archives that trace the story of this land and its people.$t$,
   $t$يجمع المتحف، الذي يشغل مبنى يحمل تاريخه الخاص، بين المقتنيات والأعمال الفنية والأرشيفات التي تروي قصة هذه الأرض وأهلها.$t$,
   0),

  ($t$کۆکراوە و پێشانگاکانی بە ئاگاداری شێواندراون — هەر پارچەیەک نەک تەنها بۆ بینین، بەڵکو بۆ تێگەیشتن پێشکەش دەکرێت، بۆ ئەوەی یادگاری بپارێزرێت نەک تەنها پیشان بدرێت.$t$,
   $t$Its collections and exhibitions are shaped with care — each piece presented not just to be seen, but to be understood, so that memory is preserved rather than merely displayed.$t$,
   $t$تُعرض مقتنياته ومعارضه بعناية — إذ لا تُقدَّم كل قطعة لتُرى فحسب، بل لتُفهم، لكي تُحفظ الذاكرة لا أن تُعرض فقط.$t$,
   1),

  ($t$لەگەڵ کۆکراوە بەردەوامەکەیشیدا، مۆزەخانەکە میوانداری پێشانگای کاتی، بەرنامەی کەلتووری و سەردانی پەروەردەیی دەکات کە نەوەی نوێ بە مێژووەکەیانەوە دەبەستێتەوە.$t$,
   $t$Beyond its permanent collection, the museum hosts temporary exhibitions, cultural programs, and educational visits that connect new generations with their history.$t$,
   $t$وإلى جانب مجموعته الدائمة، يستضيف المتحف معارض مؤقتة وبرامج ثقافية وزيارات تعليمية تربط الأجيال الجديدة بتاريخها.$t$,
   2),

  ($t$هەر سەردانکەر، توێژەر و خوێندکارێک کە بەناو تالارەکانیدا تێدەپەڕێت، بەشێک دەبێت لە کردەوەیەکی بەردەوامی یادکردنەوە — مێژوو زیندوو دەمێنێتەوە بەهۆی ئەو خەڵکەی بۆ بینینی دێن.$t$,
   $t$Every visitor, researcher, and student who passes through its halls adds to an ongoing act of remembrance — history kept alive through the people who come to see it.$t$,
   $t$كل زائر وباحث وطالب يمر عبر أروقته يصبح جزءًا من فعل تذكّر مستمر — تاريخ يبقى حيًا بفضل من يأتون لرؤيته.$t$,
   3);
